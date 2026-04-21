import { useEffect, useState, useMemo } from "react";
import { CustomCodeEditor } from "../../code-editor/CustomCodeEditor";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Box, Alert, Divider } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";
import { Input } from "@rnaga/wp-next-ui/Input";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $addAnimationCustomKeyframe,
  $getAnimationNode,
  $isCustomKeyframeUsed,
  $removeAnimationCustomKeyframeIfNotUsed,
} from "../../../lexical/nodes/animation/AnimationNode";
import {
  ANIMATION_PRESETS,
  ANIMATION_CATEGORIES,
} from "../../../lexical/nodes/animation/presets";
import { HISTORY_MERGE_TAG } from "lexical";
import { logger } from "../../../lexical/logger";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { ANIMATION_CUSTOM_KEYFRAMES_UPDATED_COMMAND } from "./commands";

export const DraggableKeyframeManager = (props: {
  open: boolean;
  onClose: () => void;
  targetRef?: React.RefObject<HTMLElement | null>;
}) => {
  const { open, onClose, targetRef } = props;
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();

  const [keyframeName, setKeyframeName] = useState<string>("");
  const [keyframeContent, setKeyframeContent] = useState<string>(
    "@keyframes customAnimation {\n  0% {\n  }\n}"
  );
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isAnimationPlaying, setIsAnimationPlaying] = useState(false);
  const [selectedCustomKeyframe, setSelectedCustomKeyframe] = useState<
    string | null
  >(null);
  const [customKeyframes, setCustomKeyframes] = useState<
    Record<string, string>
  >({});

  // Animation preview settings
  const [previewDuration, setPreviewDuration] = useState<number>(700);
  const [previewTimingFunction, setPreviewTimingFunction] =
    useState<string>("ease-in-out");

  // Flatten all animation presets into a single list for scaffolding
  const allPresets = useMemo(() => {
    const presets: { label: string; value: string; category: string }[] = [];
    Object.entries(ANIMATION_CATEGORIES).forEach(([category, items]) => {
      items.forEach((preset) => {
        presets.push({
          label: `${preset} (${category})`,
          value: preset,
          category,
        });
      });
    });
    return presets;
  }, []);

  // Load custom keyframes from AnimationNode
  useEffect(() => {
    editor.read(() => {
      try {
        const animationNode = $getAnimationNode();
        setCustomKeyframes(animationNode.__customKeyframes || {});
      } catch (error) {
        logger.error("Failed to load custom keyframes:", error);
      }
    });
  }, [editor, open]);

  const handleScaffoldFromPreset = (presetName: string) => {
    const preset =
      ANIMATION_PRESETS[presetName as keyof typeof ANIMATION_PRESETS];
    if (preset) {
      const name = keyframeName.trim() || "customAnimation";
      const scaffoldedContent = `@keyframes ${name} {\n${preset.keyframes
        .split("\n")
        .slice(1, -1)
        .join("\n")}\n}`;

      setKeyframeContent(scaffoldedContent);
    }
  };

  const handleSubmit = () => {
    if (!keyframeName.trim()) {
      setErrorMessage("Keyframe name is required");
      return;
    }

    // Extract keyframe content (remove first and last lines)
    const lines = keyframeContent.split("\n");
    const contentWithoutWrapper = lines.slice(1, -1).join("\n");

    // Build the final keyframe string
    const finalKeyframe = `@keyframes ${keyframeName} {\n${contentWithoutWrapper}\n}`;

    editor.update(
      () => {
        try {
          $addAnimationCustomKeyframe(editor, keyframeName, finalKeyframe);
          setErrorMessage("");

          // Reload custom keyframes
          const animationNode = $getAnimationNode();
          const updatedKeyframes = animationNode.__customKeyframes || {};
          setCustomKeyframes(updatedKeyframes);
          wpHooks.action.doCommand(ANIMATION_CUSTOM_KEYFRAMES_UPDATED_COMMAND, {
            customKeyframes: updatedKeyframes,
          });

          // Set the selected keyframe to the one we just added
          setSelectedCustomKeyframe(keyframeName);
        } catch (error: any) {
          setErrorMessage(error.message || "Failed to add custom keyframe");
        }
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  };

  const handleDelete = () => {
    if (!selectedCustomKeyframe) return;

    editor.update(
      () => {
        try {
          $removeAnimationCustomKeyframeIfNotUsed(
            editor,
            selectedCustomKeyframe
          );
          setErrorMessage("");

          // Reload custom keyframes
          const animationNode = $getAnimationNode();
          const updatedKeyframes = animationNode.__customKeyframes || {};
          setCustomKeyframes(updatedKeyframes);
          wpHooks.action.doCommand(ANIMATION_CUSTOM_KEYFRAMES_UPDATED_COMMAND, {
            customKeyframes: updatedKeyframes,
          });

          // Reset to "Create New" state
          handleSelectCustomKeyframe(null);
        } catch (error: any) {
          setErrorMessage(error.message || "Failed to delete custom keyframe");
        }
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  };

  const handleSelectCustomKeyframe = (keyframeName: string | null) => {
    setSelectedCustomKeyframe(keyframeName);
    if (keyframeName && customKeyframes[keyframeName]) {
      const keyframeString = customKeyframes[keyframeName];

      // Extract name and content from the keyframe string
      const match = keyframeString.match(
        /@keyframes\s+([a-zA-Z0-9-_]+)\s*\{([\s\S]*)\}/
      );
      if (match) {
        const name = match[1];
        const content = match[2];
        setKeyframeName(name);

        // Wrap content for editor with name - ensure newlines for proper formatting
        const editorContent = `@keyframes ${name} {\n${content}\n}`;
        setKeyframeContent(editorContent);
      }
    } else {
      // Reset to empty when selecting "Create New"
      setKeyframeName("customAnimation");
      const defaultContent = "@keyframes customAnimation {\n  0% {\n  }\n}";
      setKeyframeContent(defaultContent);
    }
  };

  const handlePlayAnimation = () => {
    setIsAnimationPlaying(true);
    setTimeout(() => {
      setIsAnimationPlaying(false);
    }, previewDuration);
  };

  // Update editor first line when keyframe name changes
  useEffect(() => {
    // Only update if we're creating a new keyframe (not editing existing)
    if (selectedCustomKeyframe) return;

    const name = keyframeName.trim() || "customAnimation";
    const lines = keyframeContent.split("\n");

    // Only update if the first line needs to change
    const expectedFirstLine = `@keyframes ${name} {`;
    if (lines[0] !== expectedFirstLine) {
      const newValue = [expectedFirstLine, ...lines.slice(1)].join("\n");
      setKeyframeContent(newValue);

      // Clear any error message when keyframe name changes
      setErrorMessage("");
    }
  }, [keyframeName, selectedCustomKeyframe, keyframeContent]);

  const isCustomKeyframeUsed = useMemo(() => {
    return !selectedCustomKeyframe
      ? false
      : editor.read(() => $isCustomKeyframeUsed(selectedCustomKeyframe));
  }, [selectedCustomKeyframe, keyframeName]);

  return (
    <DraggableBox
      onClose={onClose}
      open={open}
      targetRef={targetRef}
      title="Custom Keyframe Manager"
      sx={{
        minWidth: 750,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 200px",
          gap: 2,
          height: "100%",
          p: 2,
        }}
      >
        {/* Left Side - Keyframe Management */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {/* Select existing custom keyframe */}
          <Box>
            <Typography fontSize={11} fontWeight={600} sx={{ mb: 0.5 }}>
              Select Existing Custom Keyframe
            </Typography>
            <Select
              size="small"
              value={selectedCustomKeyframe || ""}
              enum={[
                { value: "", label: "Create New" },
                ...Object.keys(customKeyframes).map((name) => ({
                  value: name,
                  label: name,
                })),
              ]}
              onChange={(value) => handleSelectCustomKeyframe(value || null)}
            />
          </Box>

          <Divider />

          {/* Keyframe Name */}
          <Box>
            <Typography fontSize={11} fontWeight={600} sx={{ mb: 0.5 }}>
              Keyframe Name
            </Typography>
            <Input
              size="small"
              value={keyframeName}
              onChange={(value) => setKeyframeName(value)}
              placeholder="e.g., myCustomAnimation"
              disabled={!!selectedCustomKeyframe}
              sx={{ width: "100%" }}
            />
          </Box>

          {/* Scaffold from preset */}
          <Box>
            <Typography fontSize={11} fontWeight={600} sx={{ mb: 0.5 }}>
              Scaffold from Preset (Optional)
            </Typography>
            <SelectAutocomplete
              size="small"
              value=""
              items={allPresets}
              onChange={(value) => handleScaffoldFromPreset(value)}
              // placeholder="Select a preset to scaffold..."
            />
          </Box>

          {/* Code Editor */}
          <Box>
            <Typography fontSize={11} fontWeight={600} sx={{ mb: 0.5 }}>
              Keyframe CSS Properties
            </Typography>

            <CustomCodeEditor
              key={selectedCustomKeyframe || "new"}
              options={{
                padding: { bottom: 0 },
                autoIndent: "advanced",
                formatOnPaste: true,
                formatOnType: true,
                minimap: { enabled: false },
              }}
              height={250}
              defaultLanguage="css"
              initialValue={keyframeContent}
              onChange={setKeyframeContent}
              protectLineNumber={1}
              protectLastLine={true}
              onErrorMessage={setErrorMessage}
            />
            <Typography fontSize={9} color="text.secondary" sx={{ mt: 0.5 }}>
              Note: The keyframe name in the first line updates automatically
              from the &quot;Keyframe Name&quot; field above. The last line
              &quot;&#125;&quot; cannot be edited.
            </Typography>
          </Box>

          {/* Error Message */}
          {errorMessage && (
            <Alert
              severity="error"
              sx={{
                fontSize: 11,
                py: 0.5,
              }}
            >
              {errorMessage}
            </Alert>
          )}

          {/* Submit and Delete Buttons */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
            }}
          >
            {selectedCustomKeyframe && !isCustomKeyframeUsed && (
              <Button size="small" color="error" onClick={handleDelete}>
                Delete
              </Button>
            )}
            <Button
              size="small"
              onClick={handleSubmit}
              disabled={!keyframeName.trim() || errorMessage !== ""}
            >
              {selectedCustomKeyframe ? "Update" : "Add"}
            </Button>
          </Box>
        </Box>

        {/* Right Side - Animation Preview */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
            borderLeft: "1px solid",
            borderColor: "divider",
            pl: 2,
          }}
        >
          <Typography fontSize={11} fontWeight={600}>
            Preview
          </Typography>

          {/* Preview settings */}
          <Box>
            <Typography fontSize={10} fontWeight={500} sx={{ mb: 0.5 }}>
              Duration (ms)
            </Typography>
            <Input
              size="small"
              type="number"
              value={previewDuration}
              onChange={(val) => setPreviewDuration(Number(val))}
              sx={{ width: "100%" }}
            />
          </Box>

          <Box>
            <Typography fontSize={10} fontWeight={500} sx={{ mb: 0.5 }}>
              Timing
            </Typography>
            <Select
              size="small"
              value={previewTimingFunction}
              enum={[
                { value: "linear", label: "Linear" },
                { value: "ease", label: "Ease" },
                { value: "ease-in", label: "Ease In" },
                { value: "ease-out", label: "Ease Out" },
                { value: "ease-in-out", label: "Ease In Out" },
              ]}
              onChange={(val) => setPreviewTimingFunction(val)}
            />
          </Box>

          {/* Preview Box */}
          <Box
            sx={{
              width: "100%",
              height: 150,
              bgcolor: "grey.50",
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Inject custom keyframe */}
            {keyframeContent && (
              <style>
                {`@keyframes customPreview {
                  ${keyframeContent.split("\n").slice(1, -1).join("\n")}
                }`}
              </style>
            )}
            <Box
              sx={{
                width: 50,
                height: 50,
                bgcolor: "primary.main",
                borderRadius: 1,
              }}
              style={{
                animation: isAnimationPlaying
                  ? `customPreview ${previewDuration}ms ${previewTimingFunction}`
                  : "none",
              }}
            />
          </Box>

          <Button
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={handlePlayAnimation}
            sx={{
              width: "100%",
            }}
          >
            Play
          </Button>
        </Box>
      </Box>
    </DraggableBox>
  );
};
