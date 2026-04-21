import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, Checkbox, Tooltip } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { MediaSelector } from "../../../../client/forms/components";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { logger } from "../../../logger";
import { $loadTemplateText } from "../../template-text/TemplateTextNode";
import { SettingsRightPanelForm } from "../../wp/client/SettingsRightPanelForm";
import { $isVideoNode } from "../VideoNode";

export const VideoRightPanelForm = () => {
  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();

  const [mediaUrl, setMediaUrl] = useState<string>();
  const [controls, setControls] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playsinline, setPlaysinline] = useState(false);

  const handleChange = (url?: string) => {
    if (!selectedNode) return;
    if (!$isVideoNode(selectedNode)) return;

    setMediaUrl(url ?? "");
    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.setSettings({
          ...writable.getSettings(),
          url,
        });
        $loadTemplateText(writable);
        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  const handleAttributeCheckbox = (
    key: "controls" | "autoplay" | "loop" | "muted" | "playsinline",
    checked: boolean
  ) => {
    if (!$isVideoNode(selectedNode)) return;

    switch (key) {
      case "controls":
        setControls(checked);
        break;
      case "autoplay":
        setAutoplay(checked);
        break;
      case "loop":
        setLoop(checked);
        break;
      case "muted":
        setMuted(checked);
        break;
      case "playsinline":
        setPlaysinline(checked);
        break;
    }

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        const currentAttributes = { ...writable.getAttributes() } as Record<
          string,
          any
        >;
        if (checked) {
          currentAttributes[key] = "";
        } else {
          delete currentAttributes[key];
        }
        writable.setAttributes(currentAttributes);
        editor.dispatchCommand(NODE_PROPERTY_UPDATED, { node: writable });
      },
      { discrete: true }
    );
  };

  useEffect(() => {
    logger.debug("selectedNode changed:", selectedNode);
    if (!$isVideoNode(selectedNode)) {
      return;
    }

    const latestNode = editor.read(() => selectedNode.getLatest());

    setMediaUrl(latestNode.getSettings().url);

    const attrs = latestNode.getAttributes() as Record<string, any>;
    setControls("controls" in attrs);
    setAutoplay("autoplay" in attrs);
    setLoop("loop" in attrs);
    setMuted("muted" in attrs);
    setPlaysinline("playsinline" in attrs);
  }, [selectedNode]);

  if (!selectedNode) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
      }}
    >
      <Box sx={{ width: "100%", my: 1.5 }}>
        <RightPanelSectionTitle title="General Settings" />
      </Box>

      <MediaSelector
        onChange={handleChange}
        mediaUrl={mediaUrl}
        mediaType="video"
        size="small"
      />

      <Box sx={{ width: "100%", my: 2 }}>
        <RightPanelSectionTitle title="Playback Options" />
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Tooltip title="Shows playback controls." placement="right" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                size="small"
                checked={controls}
                onChange={(e) =>
                  handleAttributeCheckbox("controls", e.target.checked)
                }
              />
              <Typography fontSize={12}>Controls</Typography>
            </Box>
          </Tooltip>
          <Tooltip
            title="Requires Muted on most browsers."
            placement="right"
            arrow
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                size="small"
                checked={autoplay}
                onChange={(e) =>
                  handleAttributeCheckbox("autoplay", e.target.checked)
                }
              />
              <Typography fontSize={12}>Autoplay</Typography>
            </Box>
          </Tooltip>
          <Tooltip
            title="Restarts when the video ends."
            placement="right"
            arrow
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                size="small"
                checked={loop}
                onChange={(e) =>
                  handleAttributeCheckbox("loop", e.target.checked)
                }
              />
              <Typography fontSize={12}>Loop</Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Silences audio by default." placement="right" arrow>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                size="small"
                checked={muted}
                onChange={(e) =>
                  handleAttributeCheckbox("muted", e.target.checked)
                }
              />
              <Typography fontSize={12}>Muted</Typography>
            </Box>
          </Tooltip>
          <Tooltip
            title="Plays inline on iOS instead of fullscreen."
            placement="right"
            arrow
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Checkbox
                size="small"
                checked={playsinline}
                onChange={(e) =>
                  handleAttributeCheckbox("playsinline", e.target.checked)
                }
              />
              <Typography fontSize={12}>Plays Inline</Typography>
            </Box>
          </Tooltip>
        </Box>
      </Box>

      <SettingsRightPanelForm
        isChild
        hideAttributeKeys={[
          "controls",
          "autoplay",
          "loop",
          "muted",
          "playsinline",
        ]}
      />
    </Box>
  );
};
