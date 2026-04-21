import {
  $getRoot,
  DecoratorNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { $walkNode } from "../../walk-node";
import { AnimationPreset } from "./types";
import { ANIMATION_PRESETS } from "./presets";
import type * as types from "../../../types/css-animation";
import { $isWPLexicalNode, WPLexicalNode } from "../wp";
import { createVoidElement } from "../wp/create-void-element";

type AnimationPresets = AnimationPreset[];

export type SerializedAnimationNode = Spread<
  {
    __presets: AnimationPresets;
    __customKeyframes: Record<string, string>;
  },
  SerializedLexicalNode
>;

export class AnimationNode extends DecoratorNode<null> {
  __presets: AnimationPresets = [];
  __customKeyframes: Record<string, string> = {};

  constructor(key?: string, presets?: AnimationPresets) {
    super(key);
    this.__presets = presets || [];
    this.__customKeyframes = {};
  }

  static getType(): string {
    return "animation";
  }

  static clone(node: AnimationNode): AnimationNode {
    const newNode = new AnimationNode(node.__key, node.__presets);
    newNode.__customKeyframes = { ...node.__customKeyframes };
    return newNode;
  }

  decorate(editor: LexicalEditor, config: EditorConfig) {
    return null;
  }

  isEmpty(): boolean {
    return !this.__presets || this.__presets.length === 0;
  }

  set(data: AnimationPresets) {
    this.__presets = {
      ...this.__presets,
      ...data,
    };
  }

  getKeyFrame(key: string) {
    for (const preset of this.__presets) {
      if (preset === key) {
        return ANIMATION_PRESETS[key].keyframes;
      }
    }

    for (const customKey in this.__customKeyframes) {
      if (customKey === key) {
        return this.__customKeyframes[customKey];
      }
    }

    return null;
  }

  getAllKeyFrames() {
    const keyframes: Record<string, any> = {};
    for (const preset of this.__presets) {
      keyframes[preset] = ANIMATION_PRESETS[preset].keyframes;
    }

    // Add custom keyframes
    for (const customKey in this.__customKeyframes) {
      keyframes[customKey] = this.__customKeyframes[customKey];
    }
    return keyframes;
  }

  getCustomKeyFrameNames() {
    return Object.keys(this.__customKeyframes);
  }

  removePreset(key: AnimationPreset) {
    // Remove key from __presets which is array of AnimationPreset
    const newPresets = this.__presets?.filter((preset) => preset !== key);
    this.__presets = newPresets;
  }

  createDOM(): HTMLElement {
    const element = createVoidElement();
    return element;
  }

  updateDOM(
    prevNode: AnimationNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    return false;
  }

  static importJSON(serializedNode: SerializedAnimationNode): AnimationNode {
    const node = $createAnimationNode();
    node.__presets = serializedNode.__presets || [];
    node.__customKeyframes = serializedNode.__customKeyframes || {};

    return node;
  }

  exportJSON(): SerializedAnimationNode {
    return {
      ...super.exportJSON(),
      __presets: this.__presets || [],
      __customKeyframes: this.__customKeyframes || {},
      type: "animation",
      version: 1,
    };
  }
}

export const $createAnimationNode = (node?: AnimationNode): AnimationNode => {
  const animation = new AnimationNode(undefined, node?.__presets);
  if (node) {
    animation.__customKeyframes = { ...node.__customKeyframes };
  }
  return animation;
};

export const $isAnimationNode = (node: LexicalNode): node is AnimationNode => {
  return node instanceof AnimationNode;
};

export const $getAnimationNode = () => {
  const node = $getRoot().getChildren().find($isAnimationNode);

  // Create a new AnimationNode if it doesn't exist
  if (!node) {
    throw new Error(
      "AnimationNode not found. Please create a new AnimationNode."
    );
  }

  return node as AnimationNode;
};

export const $addAnimationCustomKeyframe = (
  editor: LexicalEditor,
  name: string,
  keyframe: string
) => {
  const node = $getAnimationNode();
  const writable = node.getWritable();

  // Make sure name isn't in presets
  if (writable.__presets.includes(name as AnimationPreset)) {
    throw new Error(
      `Cannot add custom keyframe with name "${name}" because it conflicts with an existing preset. Please use a different name.`
    );
  }

  // Remove newline characters and excessive whitespace to ensure valid CSS syntax
  const sanitizedKeyframe = keyframe
    .replace(/\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  writable.__customKeyframes[name] = sanitizedKeyframe;
};

export const $addAnimationPreset = (
  editor: LexicalEditor,
  preset: AnimationPreset
) => {
  const node = $getAnimationNode();
  const writable = node.getWritable();

  // Get the current presets and add the new preset if it doesn't exist
  // Use Set to ensure uniqueness
  const currentPresets = new Set(writable.__presets);
  currentPresets.add(preset);

  writable.__presets = Array.from(currentPresets);
};

export const $removeAnimationPresetIfNotUsed = (
  editor: LexicalEditor,
  preset: AnimationPreset,
  options?: {
    excludeNode?: WPLexicalNode;
  }
) => {
  const node = $getAnimationNode();
  const excludeNode = options?.excludeNode;
  const presets = node.__presets;

  // Return early if the preset is not in the node's presets
  if (!presets.includes(preset)) {
    return;
  }

  let isUsed = false;

  $walkNode($getRoot(), (node) => {
    if (!$isWPLexicalNode(node) || node.getKey() === excludeNode?.getKey()) {
      return;
    }

    // Get css animations from the node
    const cssAnimations: types.CSSAnimation[] | undefined =
      node.__css.get().__animation;

    if (!cssAnimations || cssAnimations.length === 0) {
      return;
    }

    // Get all keyframe names used in the node
    const usedKeyframes = cssAnimations.map(
      (animation) => animation.$keyframeName
    );

    // Check if the preset is used
    if (usedKeyframes.includes(preset)) {
      isUsed = true;
    }
  });

  // If the preset is not used by any node, remove it from the AnimationNode
  if (!isUsed) {
    const writable = node.getWritable();
    writable.removePreset(preset);
  }
};

export const $removeAnimationCustomKeyframeIfNotUsed = (
  editor: LexicalEditor,
  keyframeName: string
) => {
  const node = $getAnimationNode();
  const customKeyframes = node.__customKeyframes;

  // Return early if the keyframe is not in the node's custom keyframes
  if (!customKeyframes[keyframeName]) {
    return;
  }

  // If the custom keyframe is not used by any node, remove it from the AnimationNode
  if (!$isCustomKeyframeUsed(keyframeName)) {
    const writable = node.getWritable();
    delete writable.__customKeyframes[keyframeName];
  }
};

export const $isCustomKeyframeUsed = (keyframeName: string): boolean => {
  let isUsed = false;

  $walkNode($getRoot(), (node) => {
    if (!$isWPLexicalNode(node)) {
      return;
    }

    // Get css animations from the node
    const cssAnimations: types.CSSAnimation[] | undefined =
      node.__css.get().__animation;

    if (!cssAnimations || cssAnimations.length === 0) {
      return;
    }

    // Get all keyframe names used in the node
    const usedKeyframes = cssAnimations.map(
      (animation) => animation.$keyframeName
    );

    // Check if the custom keyframe is used
    if (usedKeyframes.includes(keyframeName)) {
      isUsed = true;
    }
  });

  return isUsed;
};

export const $getKeyframeByName = (name: string): string | null => {
  const node = $getAnimationNode();

  if (ANIMATION_PRESETS[name as AnimationPreset]) {
    return ANIMATION_PRESETS[name as AnimationPreset].keyframes;
  }

  return node.__customKeyframes[name] || null;
};

export const isPresetKeyframe = (
  name: string | undefined
): name is AnimationPreset => {
  return !!ANIMATION_PRESETS[name as AnimationPreset];
};
