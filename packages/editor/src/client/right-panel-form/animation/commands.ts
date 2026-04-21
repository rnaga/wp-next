import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";

/**
 * Fired whenever custom keyframes in the AnimationNode are mutated
 * (added, updated, or deleted) so subscribers can refresh their lists.
 * Carries the full updated custom keyframes record so subscribers do not
 * need to re-read the editor state themselves.
 */
export const ANIMATION_CUSTOM_KEYFRAMES_UPDATED_COMMAND =
  createActionCommand<{
    customKeyframes: Record<string, string>;
  }>();
