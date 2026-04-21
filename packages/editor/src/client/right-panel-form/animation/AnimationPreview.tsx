import { useEffect, useMemo, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Box } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";

import { $getKeyframeByName } from "../../../lexical/nodes/animation/AnimationNode";

import type { AnimationRule } from "../../../lexical/nodes/animation/types";

/**
 * Stable class name applied to the preview box so injected CSS rules can target
 * both the element itself and its pseudo-elements (::before / ::after).
 */
const PREVIEW_CLASS = "wp-animation-preview";

/**
 * Builds the CSS rule string for the preview box, incorporating custom properties
 * and the animation shorthand (when the user hits Play).
 *
 * The selector targets the pseudo-element when one is configured so the preview
 * faithfully represents how the final CSS will look.
 */
const buildPreviewRuleCSS = (rule: AnimationRule, isPlaying: boolean): string => {
  const { pseudoElement, customProperties, animation } = rule;
  const hasKeyframe = Boolean(animation.keyframe);
  const lines: string[] = [];

  if (customProperties) {
    for (const [prop, val] of Object.entries(customProperties)) {
      lines.push(`${prop}: ${val}`);
    }
  }

  if (hasKeyframe && isPlaying) {
    const animValue = [
      animation.keyframe,
      `${animation.duration}ms`,
      animation.timingFunction || "ease-in-out",
      `${animation.delay || 0}ms`,
      animation.iterationCount || 1,
      animation.direction || "normal",
      animation.fillMode || "none",
    ].join(" ");
    lines.push(`animation: ${animValue}`);
  }

  if (lines.length === 0) {
    return "";
  }

  const selector = `.${PREVIEW_CLASS}${pseudoElement || ""}`;
  return `${selector} { ${lines.join("; ")}; }`;
};

export const AnimationPreview = ({ rule }: { rule: AnimationRule }) => {
  const [editor] = useLexicalComposerContext();
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Read keyframe CSS (the @keyframes block) from the editor whenever the selected
  // keyframe name changes. Kept in state so we never call editor.read() during render,
  // which can flush pending Lexical updates and trigger setState in another component.
  const [keyframeCSS, setKeyframeCSS] = useState("");

  useEffect(() => {
    const css = editor.read(
      () => $getKeyframeByName(rule.animation.keyframe) || ""
    );
    setKeyframeCSS(css);
  }, [rule.animation.keyframe]);

  // Recompute whenever the rule or play state changes. isPlaying controls whether
  // the animation shorthand is included in the injected CSS.
  const previewRuleCSS = useMemo(
    () => buildPreviewRuleCSS(rule, isPlaying),
    [rule, isPlaying]
  );

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(
      () => setIsPlaying(false),
      (rule.animation.duration || 700) + (rule.animation.delay || 0)
    );
  };

  return (
    <Box sx={{ width: "100%", mb: 2 }}>
      <Button
        size="small"
        onClick={() => setShowPreview((prev) => !prev)}
        sx={{ width: "100%", mb: showPreview ? 1 : 0 }}
      >
        {showPreview ? "Hide" : "Show"} Animation Preview
      </Button>

      {showPreview && (
        <>
          <Box
            sx={{
              width: "100%",
              height: 120,
              bgcolor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
              mb: 1,
            }}
          >
            {/* @keyframes definition for the selected preset / custom keyframe */}
            <style>{keyframeCSS}</style>
            {/* Rule CSS: custom properties + animation shorthand on the element or pseudo-element */}
            {previewRuleCSS && <style>{previewRuleCSS}</style>}
            <Box
              className={PREVIEW_CLASS}
              sx={{
                width: 60,
                height: 60,
                bgcolor: "primary.main",
                borderRadius: 1,
                // Required so ::before / ::after with position: absolute are
                // contained within the preview box rather than the viewport.
                position: "relative",
              }}
            />
          </Box>
          <Button
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={handlePlay}
            sx={{ width: "100%" }}
          >
            Play
          </Button>
        </>
      )}
    </Box>
  );
};
