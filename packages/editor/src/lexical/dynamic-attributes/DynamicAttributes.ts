import { $getEditor, $getRoot, EditorConfig, NodeKey } from "lexical";

import { DYNAMIC_ATTRIBUTES_EDITOR_CONFIG_HIDDEN } from "../constants";
import type { CSS } from "../styles-core/css";
import type { WPLexicalNode, SerializedWPNode } from "../nodes/wp/types";
import type {
  DynamicAttributesJSON,
  DynamicAttributeRule,
  DynamicAttributeSettings,
} from "./types";
import { deferredWalkNodeWithWidgets } from "../deferred";
import { isServerSide } from "../environment";

export class DynamicAttributes {
  // Node key associated with this instance
  __nodeKey: NodeKey;

  // Array of condition/settings rules
  __rules: DynamicAttributesJSON = [];

  // Reference to the CSS instance for external classname manipulation
  __cssRef: CSS | null = null;

  // Track custom attribute keys that have been applied to the DOM
  // This allows us to clean them up even after rules are removed
  __appliedCustomAttributes: Set<string> = new Set();
  // Track dynamic class names that were applied to the DOM.
  // These are transient and should never mutate css.__externalClassNames.
  __appliedDynamicClassNames: Set<string> = new Set();

  // Per-node editor config — ephemeral debug/editor state, not persisted in exportJSON.
  // CLIENT-SIDE ONLY: values are only ever set on the client. On the server this
  // object is always empty, so reads always return undefined server-side.
  private __editorConfig: Record<string, string | number | boolean> = {};

  constructor(nodeKey: NodeKey) {
    this.__nodeKey = nodeKey;
  }

  /**
   * Sets a per-node editor config value.
   * CLIENT-SIDE ONLY — throws if called on the server.
   */
  setEditorModeConfig(key: string, value: string | number | boolean): void {
    if (isServerSide()) {
      throw new Error(
        "DynamicAttributes.setEditorModeConfig() must only be called on the client side."
      );
    }
    this.__editorConfig[key] = value;
  }

  /**
   * Merges multiple per-node editor config values at once.
   * CLIENT-SIDE ONLY — throws if called on the server.
   */
  mergeEditorModeConfig(config: Partial<typeof this.__editorConfig>): void {
    if (isServerSide()) {
      throw new Error(
        "DynamicAttributes.mergeEditorModeConfig() must only be called on the client side."
      );
    }

    for (const [key, value] of Object.entries(config)) {
      if (value === undefined || value === null) {
        // Delete the key if the value is undefined or null
        delete this.__editorConfig[key];
      } else {
        this.__editorConfig[key] = value;
      }
    }
  }

  getAllEditorModeConfig(): Record<string, string | number | boolean> {
    return this.__editorConfig;
  }

  /**
   * Gets a per-node editor config value.
   * Safe to call on the server — always returns undefined server-side because
   * __editorConfig is never populated there.
   */
  getEditorModeConfig(key: string): string | number | boolean | undefined {
    return this.__editorConfig[key];
  }

  // Attach CSS reference for external classname manipulation
  setCSSRef(css: CSS) {
    this.__cssRef = css;
  }

  // Get the CSS reference
  getCSSRef(): CSS | null {
    return this.__cssRef;
  }

  // Get all rules
  getRules(): DynamicAttributesJSON {
    return this.__rules;
  }

  // Set all rules
  setRules(rules: DynamicAttributesJSON) {
    this.__rules = rules;
  }

  // Add a new rule
  addRule(rule: DynamicAttributeRule) {
    this.__rules.push(rule);
  }

  // Update a rule at index
  updateRule(index: number, rule: DynamicAttributeRule) {
    if (index >= 0 && index < this.__rules.length) {
      this.__rules[index] = rule;
    }
  }

  // Remove a rule at index
  removeRule(index: number) {
    if (index >= 0 && index < this.__rules.length) {
      this.__rules.splice(index, 1);
    }
  }

  // Check if there are any rules
  hasRules(): boolean {
    return this.__rules.length > 0;
  }

  // Clone the DynamicAttributes instance
  static clone(node: WPLexicalNode): DynamicAttributes {
    const prevDynamicAttrs = (node as any).__dynamicAttributes as
      | DynamicAttributes
      | undefined;
    const newDynamicAttrs = new DynamicAttributes(node.getKey());

    if (prevDynamicAttrs) {
      newDynamicAttrs.__rules = structuredClone(prevDynamicAttrs.__rules);
      newDynamicAttrs.__appliedCustomAttributes = new Set(
        prevDynamicAttrs.__appliedCustomAttributes
      );
      newDynamicAttrs.__appliedDynamicClassNames = new Set(
        prevDynamicAttrs.__appliedDynamicClassNames
      );
      // __editorConfig is ephemeral but must be carried forward on clone so
      // that updates via getWritable() preserve the current editor state.
      (newDynamicAttrs as any).__editorConfig = {
        ...(prevDynamicAttrs as any).__editorConfig,
      };
    }

    return newDynamicAttrs;
  }

  // Import from JSON
  static importJSON(
    node: WPLexicalNode,
    serialized: SerializedWPNode
  ): DynamicAttributes {
    const dynamicAttrs = new DynamicAttributes(node.getKey());
    const serializedDynamicAttrs = (serialized as any).__dynamicAttributes;

    if (serializedDynamicAttrs?.__rules) {
      dynamicAttrs.__rules = serializedDynamicAttrs.__rules;
    }

    return dynamicAttrs;
  }

  // Export to JSON
  exportJSON(): { __rules: DynamicAttributesJSON } {
    return {
      __rules: this.__rules,
    };
  }

  /**
   * Compute what dynamic attributes would be applied given the current data context,
   * without touching the DOM. Used by the client-side reload engine to re-apply
   * dynamic values after data mutations (e.g. pagination, ReactDecorators).
   *
   * Returns all possible attribute keys across all rules (matched and unmatched) so
   * the caller can remove stale values that were previously matched but no longer are.
   */
  computeAttributes(options: {
    data?: Record<string, any>;
    node: WPLexicalNode;
  }): {
    /** Data fetching node names referenced in conditions (e.g. "${posts.title}" → "posts") */
    dataKeys: string[];
    /** Class names to add — only from rules whose conditions matched */
    classNames: string[];
    /** All class names across every rule — used to remove stale values */
    allPossibleClassNames: string[];
    /** Custom attributes to set — only from rules whose conditions matched */
    customAttributes: Record<string, string>;
    /** All custom attribute keys across every rule — used to remove stale values */
    allPossibleCustomAttributeKeys: string[];
    /** Whether the element should be visible (false means display:none) */
    display: boolean;
  } {
    // Import evaluation function lazily to avoid circular dependencies
    const { evaluateConditions } = require("./evaluate-conditions");

    const allPossibleClassNames = new Set<string>();
    const allPossibleCustomAttributeKeys = new Set<string>();
    const dataKeySet = new Set<string>();

    for (const rule of this.__rules) {
      if (rule.settings.externalClassnames?.length) {
        for (const cn of rule.settings.externalClassnames) {
          const trimmed = cn.trim();
          if (trimmed) {
            allPossibleClassNames.add(trimmed);
          }
        }
      }

      if (rule.settings.customAttributes) {
        for (const key of Object.keys(rule.settings.customAttributes)) {
          allPossibleCustomAttributeKeys.add(key);
        }
      }

      // Extract data fetching names from condition keys.
      // For standard keys like "${posts.title}", extract "posts".
      // For pagination keys like "${%pagination.posts.page}", extract "posts"
      // (the data fetching node name embedded in the pagination expression).
      for (const condition of rule.conditions) {
        const matches = condition.key.matchAll(/\$\{([^}]+)/g);
        for (const match of matches) {
          const segments = match[1].trim().split(".");
          if (segments[0] === "%pagination") {
            const dataName = segments[1]?.trim();
            if (dataName) {
              dataKeySet.add(dataName);
            }
          } else {
            dataKeySet.add(segments[0]);
          }
        }
      }
    }

    // When hidden mode is set, return defaults so the reload engine removes all
    // previously applied dynamic attributes without applying new ones.
    // allPossibleClassNames/Keys are still returned so stale values get cleared.
    if (this.__editorConfig[DYNAMIC_ATTRIBUTES_EDITOR_CONFIG_HIDDEN]) {
      return {
        dataKeys: [...dataKeySet],
        classNames: [],
        allPossibleClassNames: [...allPossibleClassNames],
        customAttributes: {},
        allPossibleCustomAttributeKeys: [...allPossibleCustomAttributeKeys],
        display: true,
      };
    }

    let display = true;
    const matchedClassNames = new Set<string>();
    const matchedCustomAttributes: Record<string, string> = {};

    for (const rule of this.__rules) {
      if (!evaluateConditions(rule, options)) {
        continue;
      }

      if (!rule.settings.display) {
        display = false;
      }

      if (rule.settings.externalClassnames?.length) {
        for (const cn of rule.settings.externalClassnames) {
          const trimmed = cn.trim();
          if (trimmed) {
            matchedClassNames.add(trimmed);
          }
        }
      }

      if (rule.settings.customAttributes) {
        for (const [key, value] of Object.entries(
          rule.settings.customAttributes
        )) {
          if (value !== undefined && value !== null) {
            matchedCustomAttributes[key] = String(value);
          }
        }
      }
    }

    return {
      dataKeys: [...dataKeySet],
      classNames: [...matchedClassNames],
      allPossibleClassNames: [...allPossibleClassNames],
      customAttributes: matchedCustomAttributes,
      allPossibleCustomAttributeKeys: [...allPossibleCustomAttributeKeys],
      display,
    };
  }

  // Apply dynamic attributes to DOM element
  // This is called during createDOM and updateDOM
  applyToDOM(
    element: HTMLElement,
    options: {
      data?: Record<string, any>;
      node: WPLexicalNode;
      config: EditorConfig;
    }
  ): void {
    // Import evaluation function lazily to avoid circular dependencies
    const { evaluateConditions } = require("./evaluate-conditions");

    // First, clear all previously applied dynamic attributes
    this.#clearDynamicAttributes(element);

    // When hidden mode is set, skip applying rules so the node renders with its
    // base appearance (no dynamic class names, attributes, or display:none).
    if (this.__editorConfig[DYNAMIC_ATTRIBUTES_EDITOR_CONFIG_HIDDEN]) {
      return;
    }

    // Then apply settings for rules that match
    for (const rule of this.__rules) {
      const conditionsMet = evaluateConditions(rule, options);

      if (conditionsMet) {
        this.#applySettings(element, rule.settings);
      }
    }
  }

  // Clear all dynamically applied attributes (private method)
  #clearDynamicAttributes(element: HTMLElement): void {
    // 1. Clear dynamic display style
    element.style.removeProperty("display");

    // 2. Clear dynamic classnames applied by dynamic attributes.
    // Keep static CSS classes (including css.__externalClassNames) intact.
    for (const className of this.__appliedDynamicClassNames) {
      element.classList.remove(className);
    }
    this.__appliedDynamicClassNames.clear();

    // 3. Clear custom attributes that were dynamically added
    // Use the tracked Set to remove all previously applied attributes
    // This works even after rules are removed
    for (const key of this.__appliedCustomAttributes) {
      element.removeAttribute(key);
    }
    this.__appliedCustomAttributes.clear();
  }

  // Apply settings to element (private method)
  #applySettings(
    element: HTMLElement,
    settings: DynamicAttributeSettings
  ): void {
    // 1. Handle display
    if (!settings.display) {
      element.style.setProperty("display", "none");
    }

    // 2. Handle dynamic external classnames on the DOM element only.
    if (settings.externalClassnames?.length) {
      const classNames = settings.externalClassnames
        .map((className) => className.trim())
        .filter(Boolean);

      for (const className of classNames) {
        element.classList.add(className);
        this.__appliedDynamicClassNames.add(className);
      }
    }

    // 3. Handle custom attributes
    if (settings.customAttributes) {
      Object.entries(settings.customAttributes).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          element.setAttribute(key, String(value));
          // Track that this attribute was applied
          this.__appliedCustomAttributes.add(key);
        }
      });
    }
  }
}

export const $getMappedDynamicAttributesEditorModeConfig = () => {
  let mappedConfig: Record<
    string,
    Record<string, string | number | boolean>
  > = {};

  deferredWalkNodeWithWidgets($getEditor(), (nestedEditor, node) => {
    if (hasDynamicAttributes(node)) {
      const dynamicAttrs = node.__dynamicAttributes;
      const editorConfig = dynamicAttrs.getAllEditorModeConfig();
      const className = (node as WPLexicalNode).__css.getDebugEditorClassName();

      // Skip if editorConfig is empty ({})
      if (Object.keys(editorConfig).length === 0) {
        return;
      }

      mappedConfig = {
        ...mappedConfig,
        [className]: editorConfig,
      };
    }
  });

  return mappedConfig;
};

// Type guard to check if a node has dynamic attributes
export const hasDynamicAttributes = (
  node: unknown
): node is { __dynamicAttributes: DynamicAttributes } => {
  return (
    !!(node as any)?.__dynamicAttributes &&
    (node as any).__dynamicAttributes instanceof DynamicAttributes
  );
};
