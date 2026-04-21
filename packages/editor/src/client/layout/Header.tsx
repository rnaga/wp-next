import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import DashboardIcon from "@mui/icons-material/Dashboard";
import EditIcon from "@mui/icons-material/Edit";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import ExtensionIcon from "@mui/icons-material/Extension";
import HistoryIcon from "@mui/icons-material/History";
import MonitorIcon from "@mui/icons-material/Monitor";
import PublishIcon from "@mui/icons-material/Publish";
import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  Box,
  FormControl,
  IconButton,
  IconButtonProps,
  Tooltip,
} from "@mui/material";
import { useAdminNavigation } from "@rnaga/wp-next-admin/client/hooks/use-admin-navigation";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { getMappedEditorModeConfig } from "../../lexical/editor-mode-config";
import { logger } from "../../lexical/logger";
import { $getAllCacheData } from "../../lexical/nodes/cache/CacheNode";
import { useCustomCode } from "../custom-code";
import { HelpText } from "../forms/components/HelpText";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { usePreviewLayer } from "../preview-layer";
import { PreviewHistoryBox } from "../preview-layer/PreviewHistoryBox";
import { ViewPageButton } from "../template/components/ViewPageButton";
import { useTemplate } from "../template/use-template";
import { HeaderProfile } from "./HeaderProfile";

const HeaderIconButton = (
  props: {
    tooltip: string;
    tooltipPlacement?: "bottom" | "top" | "left" | "right";
  } & IconButtonProps
) => {
  const { tooltip, tooltipPlacement = "bottom", ...rest } = props;
  return (
    <Tooltip title={tooltip} placement={tooltipPlacement}>
      <IconButton
        size="small"
        {...rest}
        sx={{
          color: (theme) => theme.palette.grey[300],
          backgroundColor: "transparent",
          borderRadius: "6px",
          padding: "6px",
          "& .MuiSvgIcon-root": {
            fontSize: "20px",
          },
          "&:hover": {
            backgroundColor: "rgba(255,255,255,0.1)",
            color: (theme) => theme.palette.grey[100],
          },
          ...rest.sx,
        }}
      />
    </Tooltip>
  );
};

type DescriptionModalMode = "save" | "publish";

const DescriptionModal = (props: {
  open: boolean;
  onClose: () => void;
  mode: DescriptionModalMode;
  onSubmit: (
    description?: string
  ) => Promise<{ success: boolean; error?: string }>;
}) => {
  const { open, onClose, mode, onSubmit } = props;
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (open) {
      setDescription("");
      setLoading(false);
      setResult(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const title = mode === "save" ? "Save Preview" : "Publish";

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await onSubmit(description || undefined);
      if (response.success) {
        setResult({
          success: true,
          message:
            mode === "save"
              ? "Preview saved successfully!"
              : "Published successfully!",
        });
      } else {
        setResult({
          success: false,
          message:
            response.error ??
            (mode === "save"
              ? "Failed to save preview."
              : `Failed to publish.: ${response.error}`),
        });
      }
    } catch {
      setResult({
        success: false,
        message:
          mode === "save" ? "Failed to save preview." : `Failed to publish.`,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minWidth: 400,
          }}
        >
          <Typography size="large" bold>
            {title}
          </Typography>

          {result === null ? (
            <>
              <FormControl fullWidth>
                <Typography size="medium">Description (optional)</Typography>
                <Input
                  size="medium"
                  value={description}
                  onChange={(value) => setDescription(value.slice(0, 50))}
                  placeholder="Enter a description"
                  multiline
                  rows={2}
                  inputProps={{ maxLength: 50 }}
                />
              </FormControl>
              {mode === "publish" && (
                <HelpText sx={{ fontSize: 11 }}>
                  Saves your editor content as the production version. This does
                  not affect page visibility.
                </HelpText>
              )}

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1,
                  mt: 1,
                }}
              >
                <Button loading={loading} size="medium" onClick={handleSubmit}>
                  {mode === "save" ? "Save" : "Publish"}
                </Button>
                <Button size="medium" color="error" onClick={onClose}>
                  Cancel
                </Button>
              </Box>
            </>
          ) : (
            <>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}
              >
                {result.success ? (
                  <CheckCircleOutlineIcon color="success" />
                ) : (
                  <ErrorOutlineIcon color="error" />
                )}
                <Typography size="medium">{result.message}</Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Button
                  size="medium"
                  onClick={onClose}
                  sx={{
                    width: "100%",
                  }}
                >
                  Close
                </Button>
              </Box>
            </>
          )}
        </Box>
      </ModalContent>
    </Modal>
  );
};

export const Header = () => {
  const [editor] = useLexicalComposerContext();
  const { current, openSelectModal, saveEditorState, publishPreview } =
    useTemplate();
  const {
    previewMode,
    updatePreviewMode,
    sendMessageToIframe,
    onMessageFromIframe,
    fullscreenIframeRef,
  } = usePreviewLayer();
  const [historyBoxOpen, setHistoryBoxOpen] = useState(false);
  const [descriptionModal, setDescriptionModal] = useState<{
    open: boolean;
    mode: DescriptionModalMode;
  }>({ open: false, mode: "save" });
  const [visibilityConfirmOpen, setVisibilityConfirmOpen] = useState(false);
  const { wpTheme } = useWPTheme();
  const { current: currentCustomCode } = useCustomCode();
  const { resolvePath } = useAdminNavigation();
  const { actions } = useEditorServerActions();

  const sendPreviewData = () => {
    const editorState = editor.getEditorState().toJSON();
    const cacheData = editor.read(() => $getAllCacheData());

    sendMessageToIframe({
      type: "PREVIEW_MODE_CHANGE",
      payload: {
        previewMode: "fullscreen",
        editorState,
        cacheData,
        customCodes: currentCustomCode.all,
      },
    });
  };

  // currentCustomCode is React state from useCustomCode() and is captured in the
  // sendPreviewData closure. Without it as a dep, the handler would use the stale
  // initial value (empty) when the iframe sends REQUEST_PREVIEW_DATA after a reload.
  // Note: editorState and cacheData are NOT stale — they are read at call time via
  // editor.getEditorState() and editor.read(), which always reflect current state.
  useEffect(() => {
    return onMessageFromIframe((data) => {
      if (data?.type !== "REQUEST_PREVIEW_DATA") return;
      sendPreviewData();
    });
  }, [currentCustomCode]);

  return (
    <Box
      sx={{
        backgroundColor: wpTheme.layout.backgroundColor,
        color: (theme) => theme.palette.grey[100],
        width: "100%",
        position: "fixed",
        zIndex: wpTheme.zIndex.layout,
      }}
    >
      <Box
        sx={{
          height: "50px",
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 1,
          pl: 1,
          pr: 2,
        }}
      >
        <a href={resolvePath("default")}>
          <HeaderIconButton tooltip="Admin Dashboard">
            <DashboardIcon />
          </HeaderIconButton>
        </a>
        <Box
          sx={{ flexGrow: 1, display: "flex", alignItems: "center", gap: 1 }}
        >
          <Button
            sx={{
              color: (theme) => theme.palette.grey[200],
              backgroundColor: "transparent",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: 600,
              px: 1.5,
              py: 0.5,
              minWidth: "unset",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: (theme) => theme.palette.grey[100],
              },
            }}
            onClick={() => openSelectModal()}
            endIcon={
              <Box
                component="span"
                sx={{
                  fontSize: "10px !important",
                  ml: -0.5,
                  opacity: 0.6,
                }}
              >
                ▾
              </Box>
            }
          >
            {current.isEmpty
              ? "Select Template"
              : (current.template?.post_title ?? `Loading...`)}
          </Button>
          {current.template?.template_config?.useWidgetOnly && (
            <Tooltip
              title="Widget only — not accessible via URL"
              placement="bottom"
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  px: 1,
                  py: "3px",
                  borderRadius: "999px",
                  backgroundColor: "rgba(255, 183, 77, 0.15)",
                  border: "1px solid rgba(255, 183, 77, 0.4)",
                  color: "#ffb74d",
                  fontSize: "11px",
                  fontWeight: 600,
                  letterSpacing: "0.02em",
                  lineHeight: 1,
                  userSelect: "none",
                }}
              >
                <ExtensionIcon sx={{ fontSize: "12px" }} />
                Widget
              </Box>
            </Tooltip>
          )}
        </Box>
        <ViewPageButton />

        {/* Reload flow: sets the fullscreen iframe src to "preview?id=...&reload=1",
            triggering a fresh page load. The iframe detects reload=1 on mount and
            sends REQUEST_PREVIEW_DATA to this window. The onMessageFromIframe listener
            below responds with the current editorState, cacheData, and customCodes
            so the iframe can reconstruct the preview without user re-interaction. */}
        {previewMode === "fullscreen" && (
          <HeaderIconButton
            tooltip="Reload Preview"
            onClick={() => {
              if (fullscreenIframeRef.current) {
                fullscreenIframeRef.current.src = `preview?id=${current.id}&reload=1`;
              }
            }}
          >
            <RefreshIcon />
          </HeaderIconButton>
        )}

        <HeaderIconButton
          tooltip={previewMode === "edit" ? "Preview" : "Edit"}
          onClick={() => {
            const newPreviewMode =
              previewMode === "edit" ? "fullscreen" : "edit";
            updatePreviewMode(newPreviewMode);
            setTimeout(() => {
              // Don't send editor state when switching to edit mode (no need to update iframe)
              if (newPreviewMode === "edit") {
                return;
              }

              // Send the updated editor state and cache data to iframe
              // which is needed for loading the page in iframe for preview.
              const editorState = editor.getEditorState().toJSON();
              const cacheData = editor.read(() => $getAllCacheData());

              logger.log("Sending preview mode change to iframe:", {
                previewMode,
                editorState,
                cacheData,
                customCodes: currentCustomCode.all,
              });
              sendMessageToIframe({
                type: "PREVIEW_MODE_CHANGE",
                payload: {
                  previewMode,
                  editorState,
                  cacheData,
                  customCodes: currentCustomCode.all,
                },
              });
            }, 10);
          }}
        >
          {previewMode === "edit" ? <MonitorIcon /> : <EditIcon />}
        </HeaderIconButton>

        <HeaderIconButton
          tooltip="Preview History"
          onClick={() => {
            setHistoryBoxOpen(true);
          }}
        >
          <HistoryIcon />
        </HeaderIconButton>

        <Button
          size="small"
          onClick={() => {
            setDescriptionModal({ open: true, mode: "save" });
          }}
          sx={{
            color: (theme) => theme.palette.grey[200],
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.16)",
            borderRadius: "6px",
            fontSize: "13px",
            px: 1.5,
            py: 0.5,
            minWidth: "unset",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.24)",
            },
          }}
          startIcon={<SaveIcon sx={{ fontSize: "16px !important" }} />}
        >
          Save
        </Button>

        {!current.isEmpty &&
          current.template &&
          current.template.template_config?.useWidgetOnly !== true && (
            <HeaderIconButton
              tooltip={
                current.template.post_status === "publish"
                  ? "Page is visible"
                  : "Page is hidden"
              }
              onClick={() => setVisibilityConfirmOpen(true)}
              sx={{
                color:
                  current.template.post_status === "publish"
                    ? "#4caf50"
                    : "#f44336",
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color:
                    current.template.post_status === "publish"
                      ? "#66bb6a"
                      : "#ef5350",
                },
              }}
            >
              {current.template.post_status === "publish" ? (
                <VisibilityIcon />
              ) : (
                <VisibilityOffIcon />
              )}
            </HeaderIconButton>
          )}

        <Button
          size="small"
          onClick={() => {
            setDescriptionModal({ open: true, mode: "publish" });
          }}
          sx={{
            color: "#fff",
            backgroundColor: "#0073aa",
            borderRadius: "6px",
            fontSize: "13px",
            px: 1.5,
            py: 0.5,
            minWidth: "unset",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#005f8d",
            },
          }}
          startIcon={<PublishIcon sx={{ fontSize: "16px !important" }} />}
        >
          Publish
        </Button>
        <HeaderProfile />
      </Box>

      <PreviewHistoryBox
        open={historyBoxOpen}
        onClose={() => setHistoryBoxOpen(false)}
      />
      <DescriptionModal
        open={descriptionModal.open}
        mode={descriptionModal.mode}
        onClose={() => setDescriptionModal({ open: false, mode: "save" })}
        onSubmit={async (description) => {
          if (descriptionModal.mode === "save") {
            const result = await saveEditorState({ description });
            return { success: result.success, error: result.error };
          } else {
            const success = await publishPreview({ description });
            return {
              success,
              error: success ? undefined : "Failed to publish.",
            };
          }
        }}
      />
      {current.template && (
        <ModalConfirm
          open={visibilityConfirmOpen}
          onClose={() => setVisibilityConfirmOpen(false)}
          title={
            current.template.post_status === "publish"
              ? "Hide Page"
              : "Make Page Visible"
          }
          message={
            current.template.post_status === "publish"
              ? "This will set the page to pending and hide it from visitors. Are you sure?"
              : "This will publish the page and make it visible to visitors. Are you sure?"
          }
          callback={async (confirm) => {
            if (!confirm || !current.template) {
              return;
            }
            const isPublic = current.template.post_status !== "publish";
            const result = await actions.template.updateVisibility(
              current.template.ID,
              isPublic
            );
            if (result.success) {
              current.set({
                template: {
                  ...current.template,
                  post_status: isPublic ? "publish" : "pending",
                },
                widgetSlugs: current.widgetSlugs,
              });
            }
          }}
        />
      )}
    </Box>
  );
};
