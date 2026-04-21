import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PublishIcon from "@mui/icons-material/Publish";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useNavigation } from "@rnaga/wp-next-core/client/hooks";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { PREVIEW_SELECTED_COMMAND } from "./commands";
import { useTemplate } from "../template/use-template";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";
import { useMemo, useState } from "react";
import * as types from "../../types";

export const PreviewHistoryBox = (props: {
  open: boolean;
  onClose: () => void;
}) => {
  const {
    previewInfoList,
    selectedPreview,
    current: currentTemplate,
    isCurrentStateSyncedWithSavedState,
  } = useTemplate();
  const { wpHooks } = useWP();
  const { pathname } = useNavigation();
  const [openConfirm, setOpenConfirm] = useState(false);
  const [selectedPreviewToSwitch, setSelectedPreviewToSwitch] = useState<
    types.TemplatePreviewInfoList[number] | undefined
  >(undefined);

  // Derive full-preview base path from current pathname
  // e.g. /admin/1/editor -> /admin/1/full-preview
  const fullPreviewBasePath = useMemo(() => {
    const segments = pathname.split("/");
    segments[segments.length - 1] = "full-preview";
    return segments.join("/");
  }, [pathname]);

  return (
    <>
      <ModalConfirm
        message="Switching to a previous preview will discard any unsaved changes. Are you sure you want to switch?"
        callback={(confirm) => {
          if (confirm && selectedPreviewToSwitch) {
            wpHooks.action.doCommand(PREVIEW_SELECTED_COMMAND, {
              previewInfo: selectedPreviewToSwitch,
            });
          }
          setOpenConfirm(false);
        }}
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
      />

      <DraggableBox
        open={props.open}
        onClose={props.onClose}
        title="Preview History"
        size="medium"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minWidth: 300,
          }}
        >
          {previewInfoList.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: 2,
              }}
            >
              <Typography size="small">No preview history available</Typography>
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: 300,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {previewInfoList.map((previewInfo) => {
                const isSelected =
                  selectedPreview?.previewInfo?.metaId === previewInfo.metaId;
                return (
                  <Box
                    key={previewInfo.metaId}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      px: 2,
                      py: 1,
                      cursor: isSelected ? "default" : "pointer",
                      borderRadius: 1,
                      backgroundColor: isSelected
                        ? (theme) => theme.palette.grey[400]
                        : "transparent",
                      "&:hover": {
                        backgroundColor: isSelected
                          ? (theme) => theme.palette.grey[400]
                          : (theme) => theme.palette.grey[200],
                      },
                    }}
                    onClick={() => {
                      if (isSelected) {
                        return;
                      }

                      if (!isCurrentStateSyncedWithSavedState()) {
                        setSelectedPreviewToSwitch(previewInfo);
                        setOpenConfirm(true);
                        return;
                      }

                      wpHooks.action.doCommand(PREVIEW_SELECTED_COMMAND, {
                        previewInfo,
                      });
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 0.5,
                        }}
                      >
                        <Typography bold>
                          {new Date(
                            previewInfo.metaValue.createdAt
                          ).toLocaleString()}
                        </Typography>
                        {previewInfo.metaValue.published && (
                          <Tooltip title="Published" placement="top">
                            <PublishIcon
                              sx={{ fontSize: 16, color: "success.main" }}
                            />
                          </Tooltip>
                        )}
                      </Box>
                      <Typography
                        sx={{ fontSize: 12, color: "text.secondary" }}
                      >
                        By: {previewInfo.metaValue.createdBy}
                      </Typography>
                      {previewInfo.metaValue.description && (
                        <Typography
                          sx={{ fontSize: 12, color: "text.secondary" }}
                        >
                          {previewInfo.metaValue.description}
                        </Typography>
                      )}
                    </Box>
                    <Tooltip title="View page preview" placement="top">
                      <IconButton
                        component="a"
                        href={`${fullPreviewBasePath}?id=${currentTemplate.id}&previewInfoKey=${previewInfo.metaKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                          flexShrink: 0,
                          color: "text.secondary",
                          "&:hover": { color: "primary.main" },
                        }}
                      >
                        <OpenInNewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      </DraggableBox>
    </>
  );
};
