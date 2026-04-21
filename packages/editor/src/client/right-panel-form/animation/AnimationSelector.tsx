import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Checkbox } from "@rnaga/wp-next-ui/Checkbox";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";
import { ButtonGroup } from "../../forms/components/ButtonGroup";
import { HelpText } from "../../forms/components/HelpText";
import type {
  AnimationConfig,
  AnimationPreset,
} from "../../../lexical/nodes/animation/types";
import { ANIMATION_CATEGORIES } from "../../../lexical/nodes/animation/presets";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getAnimationNode } from "../../../lexical/nodes/animation/AnimationNode";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { addWPHooksActionCommands } from "../../event-utils/add-commands";
import { ANIMATION_CUSTOM_KEYFRAMES_UPDATED_COMMAND } from "./commands";

export const AnimationSelector = (props: {
  value: AnimationConfig;
  onChange: (value: AnimationConfig) => void;
}) => {
  const { value, onChange } = props;
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();

  // Track custom keyframe names so allAnimations updates when they are mutated
  // via DraggableKeyframeManager. The command carries the updated record so we
  // don't need to re-read the editor state here.
  const [customKeyframeNames, setCustomKeyframeNames] = useState<string[]>(() =>
    editor.read(() => $getAnimationNode().getCustomKeyFrameNames())
  );

  useEffect(() => {
    return addWPHooksActionCommands(
      wpHooks,
      [ANIMATION_CUSTOM_KEYFRAMES_UPDATED_COMMAND],
      (_command, args) => {
        setCustomKeyframeNames(Object.keys(args.customKeyframes));
      }
    );
  }, []);

  // When the user disables the keyframe we remember what was selected so it can
  // be restored if they re-enable it without having to pick again.
  const [previousKeyframe, setPreviousKeyframe] = useState<string>(
    value.keyframe || "bounce"
  );

  const keyframeDisabled = !value.keyframe;

  const handleKeyframeDisabledChange = (disabled: boolean) => {
    if (disabled) {
      // Save the current keyframe before clearing it
      if (value.keyframe) {
        setPreviousKeyframe(value.keyframe);
      }
      handleChange("keyframe", "");
    } else {
      // Restore the previously selected keyframe
      handleChange("keyframe", previousKeyframe);
    }
  };

  // Flatten all animation presets into a single list with categories.
  // The "Custom" key in ANIMATION_CATEGORIES is a placeholder preset used
  // internally — skip it here and instead append user-defined custom keyframes
  // sourced from the AnimationNode via the action command.
  const allAnimations = useMemo(() => {
    const animations: { label: string; value: string; category: string }[] = [];

    for (const [category, presets] of Object.entries(ANIMATION_CATEGORIES)) {
      if (category === "Custom") {
        continue;
      }

      presets.forEach((preset) => {
        animations.push({
          label: `${preset} (${category})`,
          value: preset,
          category,
        });
      });
    }

    for (const keyframeName of customKeyframeNames) {
      animations.push({
        label: `${keyframeName} (Custom)`,
        value: keyframeName,
        category: "Custom",
      });
    }

    return animations;
  }, [customKeyframeNames]);

  const handleChange = <K extends keyof AnimationConfig>(
    key: K,
    newValue: AnimationConfig[K]
  ) => {
    onChange({
      ...value,
      [key]: newValue,
    });
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Disable keyframe checkbox */}
      <Box sx={{ mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Checkbox
            size="small"
            checked={keyframeDisabled}
            onChange={(e) => handleKeyframeDisabledChange(e.target.checked)}
            sx={{ p: 0 }}
          />
          <Typography fontSize={11} fontWeight={500}>
            Disable keyframe
          </Typography>
        </Box>
        <details>
          <summary
            style={{
              fontSize: 10,
              color: "inherit",
              opacity: 0.6,
              cursor: "pointer",
              listStyle: "revert",
              marginTop: 5,
              marginBottom: 8,
              paddingLeft: 8,
            }}
          >
            What does this do?
          </summary>
          <HelpText sx={{ mt: 0.5 }}>
            When checked, no keyframe is set and the{" "}
            <code>animation</code> CSS property is omitted. The rule still
            applies custom properties to the element or pseudo-element.
          </HelpText>
        </details>
      </Box>

      {/* Keyframe Selection — hidden when disabled */}
      {!keyframeDisabled && (
        <Box sx={{ mb: 2 }}>
          <Typography fontSize={11} fontWeight={500} sx={{ mb: 0.5 }}>
            Keyframe
          </Typography>
          <SelectAutocomplete
            size="small"
            value={value.keyframe}
            items={allAnimations}
            onChange={(newValue) => handleChange("keyframe", newValue)}
          />
        </Box>
      )}

      {/* Animation Parameters — hidden when no keyframe is selected */}
      {!keyframeDisabled && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Duration and Delay in same row */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={11} fontWeight={500} sx={{ mb: 0.5 }}>
                Duration (ms)
              </Typography>
              <Input
                size="small"
                type="number"
                value={value.duration}
                onChange={(val) => handleChange("duration", Number(val))}
                sx={{ width: "100%" }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={11} fontWeight={500} sx={{ mb: 0.5 }}>
                Delay (ms)
              </Typography>
              <Input
                size="small"
                type="number"
                value={value.delay || 0}
                onChange={(val) => handleChange("delay", Number(val))}
                sx={{ width: "100%" }}
              />
            </Box>
          </Box>

          {/* Timing Function - full width */}
          <Box>
            <Typography fontSize={11} fontWeight={500} sx={{ mb: 0.5 }}>
              Timing Function
            </Typography>
            <Select
              size="small"
              value={value.timingFunction || "ease-in-out"}
              enum={[
                { value: "linear", label: "Linear" },
                { value: "ease", label: "Ease" },
                { value: "ease-in", label: "Ease In" },
                { value: "ease-out", label: "Ease Out" },
                { value: "ease-in-out", label: "Ease In Out" },
                {
                  value: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
                  label: "Bounce",
                },
              ]}
              onChange={(val) => handleChange("timingFunction", val)}
            />
          </Box>

          {/* Iteration Count - full width with ButtonGroup */}
          <Box>
            <Typography fontSize={11} fontWeight={500} sx={{ mb: 0.5 }}>
              Iteration Count
            </Typography>
            <ButtonGroup
              value={value.iterationCount || 1}
              enum={[
                { value: 1, label: "1" },
                { value: 2, label: "2" },
                { value: 3, label: "3" },
                { value: "infinite", label: "Infinite" },
              ]}
              showCount={4}
              onChange={(val) =>
                val !== undefined &&
                handleChange(
                  "iterationCount",
                  val === "infinite" ? "infinite" : Number(val)
                )
              }
              sx={{ width: "100%" }}
            />
          </Box>

          {/* Direction and Fill Mode in same row */}
          <Box sx={{ display: "flex", gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={11} fontWeight={500} sx={{ mb: 0.5 }}>
                Direction
              </Typography>
              <Select
                size="small"
                value={value.direction || "normal"}
                enum={[
                  { value: "normal", label: "Normal" },
                  { value: "reverse", label: "Reverse" },
                  { value: "alternate", label: "Alternate" },
                  { value: "alternate-reverse", label: "Alt Reverse" },
                ]}
                onChange={(val) =>
                  handleChange(
                    "direction",
                    val as
                      | "normal"
                      | "reverse"
                      | "alternate"
                      | "alternate-reverse"
                  )
                }
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography fontSize={11} fontWeight={500} sx={{ mb: 0.5 }}>
                Fill Mode
              </Typography>
              <Select
                size="small"
                value={value.fillMode || "none"}
                enum={[
                  { value: "none", label: "None" },
                  { value: "forwards", label: "Forwards" },
                  { value: "backwards", label: "Backwards" },
                  { value: "both", label: "Both" },
                ]}
                onChange={(val) =>
                  handleChange(
                    "fillMode",
                    val as "none" | "forwards" | "backwards" | "both"
                  )
                }
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
