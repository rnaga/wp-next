// --- weak-styles.ts ---
type CSSProps = Partial<CSSStyleDeclaration>;
type ClassRules = Record<string, CSSProps>;
type MultiRules = Array<{ classes: string[]; rules: CSSProps }>;

let weakStyleEl: HTMLStyleElement | null = null;
let weakSheet: CSSStyleSheet | null = null;
// Track each className’s CSSStyleRule for idempotent updates
const ruleMap = new Map<string, CSSStyleRule>();

/**
 * Insert or update low-specificity rules for one or many classes.
 * - Singleton <style> (prepended to <head>) to keep lowest precedence
 * - Uses :where(.cls) to force specificity = 0,0,0 (lowest possible)
 * - Rules are wrapped in @layer weak { ... } to participate in the CSS layer cascade
 * - Idempotent: calling again updates, not duplicates
 *
 * CSS Cascade priority (low → high):
 *   @layer weak  →  other @layer (e.g. utilities)  →  unlayered styles
 *
 * Why @layer matters:
 *   Unlayered CSS always beats layered CSS regardless of specificity.
 *   External frameworks may generate styles inside @layer (e.g. @layer utilities).
 *   Without @layer, even :where() (specificity 0,0,0) would override
 *   a layered .class rule (specificity 0,1,0) because unlayered > layered.
 *   By placing weak-styles in @layer weak, both are layered, and normal
 *   specificity rules apply — 0,1,0 wins over :where()'s 0,0,0.
 *
 * Supports:
 *  - insertWeakStyles({ a: {...}, b: {...} })
 *  - insertWeakStyles([{ classes: ['a','b'], rules: {...} }])
 */
export const insertWeakStyles = (
  input: ClassRules | MultiRules,
  targetDocument?: Document
): void => {
  ensureSheet(targetDocument);

  // Normalize input to [{ classes: string[], rules }]
  const batches: Array<{ classes: string[]; rules: CSSProps }> = Array.isArray(
    input
  )
    ? input.map(({ classes, rules }) => ({ classes, rules }))
    : Object.entries(input).map(([cls, rules]) => ({ classes: [cls], rules }));

  for (const { classes, rules } of batches) {
    // If multiple classes share the *same* rules, emit once with :where(.a, .b, ...)
    // and also track/update each class individually for future updates.
    const selector = `:where(${classes
      .map((c) => `.${sanitize(c)}`)
      .join(", ")})`;

    // For classes that already exist, just update their individual rules;
    // otherwise, create a single grouped rule and map each class to it.
    const missing = classes.filter((c) => !ruleMap.has(c));
    if (missing.length) {
      // INSERT a new grouped rule inside @layer so that external layered styles
      // (e.g. Tailwind's @layer utilities) can override these on specificity.
      // Without @layer, unlayered CSS always beats layered CSS regardless of specificity.
      const decls = toCssDecls(rules);
      const index = weakSheet!.cssRules.length;
      weakSheet!.insertRule(`@layer weak { ${selector} { ${decls} } }`, index);
      const layerRule = weakSheet!.cssRules[index] as CSSLayerBlockRule;
      const inserted = layerRule.cssRules[0] as CSSStyleRule;

      // Map every class in this batch to the same CSSStyleRule
      for (const c of classes) ruleMap.set(c, inserted);
    } else {
      // UPDATE existing rules: clear all properties first so stale properties
      // from the previous call don't linger, then apply the new set fresh.
      for (const c of classes) {
        const r = ruleMap.get(c)!;
        r.style.cssText = "";
        applyProps(r.style, rules);
      }
    }
  }
};

/** Ensure singleton <style> at the top of <head> and grab its sheet */
const ensureSheet = (targetDocument?: Document) => {
  const doc = targetDocument || document;

  // Check if the existing weakStyleEl is still in the DOM
  if (weakStyleEl && !weakStyleEl.isConnected) {
    weakStyleEl = null;
    weakSheet = null;
    ruleMap.clear();
  }

  if (weakSheet) return;
  if (!weakStyleEl) {
    weakStyleEl = doc.createElement("style");
    weakStyleEl.setAttribute("data-weak-styles", "true");
    // Prepend so every other stylesheet appears later (and thus overrides)
    doc.head.prepend(weakStyleEl);
  }
  weakSheet = weakStyleEl.sheet as CSSStyleSheet;
};

// Properties where "none" is a valid CSS value and must not be treated as a removal signal.
// For all other properties (e.g. backgroundColor), "none" is invalid CSS and is used as
// a sentinel meaning "remove this property via removeProperty()".
const PROPS_WHERE_NONE_IS_VALID = new Set(["display"]);

/** Merge props into an existing CSSStyleDeclaration */
const applyProps = (style: CSSStyleDeclaration, props: CSSProps) => {
  for (const [k, v] of Object.entries(props)) {
    const kebabKey = toKebabCase(k);

    // If value is null, undefined, empty string, or "none", remove the property entirely
    // "none" is treated as a removal signal because:
    // 1. "none" is not a valid CSS value for many properties (e.g., backgroundColor)
    // 2. CSS engines ignore invalid values, so setting backgroundColor: "none" would
    //    leave the old value unchanged instead of removing it
    // 3. To actually clear a style property, we must call removeProperty()
    // 4. This allows users to explicitly remove editor styles by setting them to "none"
    // Exception: properties in PROPS_WHERE_NONE_IS_VALID accept "none" as a real value.
    if (
      v == null ||
      v === "" ||
      (v === "none" && !PROPS_WHERE_NONE_IS_VALID.has(k))
    ) {
      style.removeProperty(kebabKey);
      continue;
    }

    const stringValue = String(v);
    style.setProperty(kebabKey, stringValue);
  }
};

/** Turn a props object into CSS declarations string */
const toCssDecls = (props: CSSProps): string => {
  return Object.entries(props)
    .filter(
      ([k, v]) =>
        v != null &&
        v !== "" &&
        !(v === "none" && !PROPS_WHERE_NONE_IS_VALID.has(k))
    )
    .map(([k, v]) => `${toKebabCase(k)}: ${v};`)
    .join(" ");
};

/** camelCase -> kebab-case */
const toKebabCase = (prop: string): string => {
  return prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
};

/** safe class token */
const sanitize = (name: string): string => {
  return name.trim().replace(/[^\w-]/g, "-");
};
