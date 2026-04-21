import { useCallback, useRef, useTransition } from "react";

import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { Box, IconButton, LinearProgress, useTheme } from "@mui/material";
import { SortableList } from "@rnaga/wp-next-ui/SortableList";
import { Input } from "@rnaga/wp-next-ui/Input";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { BasicIconMenuButton } from "../forms/components/BasicIconMenuButton";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { LanguageChip } from "./LanguageChip";
import { useCustomCode } from "./use-custom-code";

import type * as types from "../../types";

export const CustomCodeNavigator = () => {
  const { wpTheme } = useWPTheme();
  const theme = useTheme();
  const {
    actions: customCodeActions,
    openModal,
    customCodes,
  } = useCustomCode();
  const { actions } = useEditorServerActions();
  const [loading, startTransition] = useTransition();
  const customCodesRef = useRef(customCodes);
  customCodesRef.current = customCodes;

  const handleSearch = useCallback(
    async (value: string) => {
      await customCodeActions.fetchAndSetList({
        search: value,
        per_page: 999,
      });
    },
    [customCodes]
  );

  const handleReorder = (fromIndex: number, toIndex: number) => {
    const current = customCodesRef.current;
    if (!current) return;
    const dragged = current[fromIndex];
    const target = current[toIndex];
    startTransition(async () => {
      const newOrder =
        target.menu_order > dragged.menu_order
          ? target.menu_order + 1
          : target.menu_order;
      await actions.customCode.changeOrder(dragged.ID, newOrder);
      await customCodeActions.fetchAndSetList();
    });
  };

  const listItemSx = {
    px: 1.5,
    py: 0.75,
    border: "none",
    borderBottom: `1px solid ${theme.palette.grey[100]}`,
    transition: "background-color 0.15s",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
      "& .edit-icon-btn": { opacity: 1 },
    },
    "&:last-child": { borderBottom: "none" },
  };

  return (
    <Box sx={{ minHeight: "100dvh" }}>
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          backgroundColor: wpTheme.leftPanel.backgroundColor,
        }}
      >
        <Box
          sx={{
            px: 2,
            backgroundColor: wpTheme.leftPanelHeader.backgroundColor,
            borderBottom: `1px solid ${wpTheme.leftPanelHeader.borderColor}`,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            "& .MuiIconButton-root": {
              color: (theme) => theme.palette.grey[500],
              borderRadius: "6px",
              padding: "4px",
              "&:hover": {
                backgroundColor: (theme) => theme.palette.grey[200],
                color: (theme) => theme.palette.grey[700],
              },
            },
          }}
        >
          <Typography
            size="small"
            sx={{
              fontSize: "13px",
              fontWeight: 600,
              color: (theme) => theme.palette.grey[700],
            }}
          >
            Custom Codes
          </Typography>
          <BasicIconMenuButton
            size="small"
            icon={<AddIcon sx={{ fontSize: 18 }} />}
            label="Add custom code"
            items={[
              { label: "Javascript", value: "application/javascript" },
              { label: "CSS", value: "text/css" },
              { label: "HTML", value: "text/html" },
            ]}
            onChange={(value) => {
              openModal({ mimeType: value as types.CustomCodeMimeType });
            }}
          />
        </Box>

        <Box sx={{ px: 1.5, py: 1.5 }}>
          <Input
            placeholder="Search custom codes..."
            size="medium"
            onChange={(value) => handleSearch(value)}
            clearable
            startAdornment={
              <SearchIcon
                sx={{
                  fontSize: 16,
                  color: (theme) => theme.palette.grey[400],
                  mr: 0.5,
                }}
              />
            }
            sx={{
              width: "100%",
              backgroundColor: (theme) => theme.palette.grey[100],
              border: "1px solid transparent",
              borderRadius: "6px",
              fontSize: "13px",
              transition: "border-color 0.15s, background-color 0.15s",
              "&:focus-within": {
                border: (theme) => `1px solid ${theme.palette.grey[300]}`,
                backgroundColor: "#fff",
              },
            }}
          />
        </Box>
      </Box>

      <Box sx={{ position: "relative" }}>
        {loading && (
          <LinearProgress
            sx={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 1 }}
          />
        )}
        <Box
          sx={{
            pointerEvents: loading ? "none" : "auto",
            opacity: loading ? 0.4 : 1,
            transition: "opacity 0.2s",
          }}
        >
          {customCodes?.length === 0 && (
            <Typography
              size="small"
              sx={{
                p: 2,
                textAlign: "center",
                border: "2px dashed",
                borderColor: "divider",
                borderRadius: 1,
                m: 2,
              }}
            >
              No custom codes yet.
              <br />
              Add one using the + button above.
            </Typography>
          )}
          <SortableList
            enum={(customCodes ?? []).map((c) => ({
              value: c,
              label: c.post_title,
            }))}
            displayType="vertical"
            sx={{
              py: 0,
              "& .MuiListItem-root": listItemSx,
            }}
            onChange={(_items, fromIndex, toIndex) =>
              handleReorder(fromIndex, toIndex)
            }
            cursor={{ idle: "default", dragging: "default" }}
            renderItem={(listItem) => {
              const customCode = listItem.value as types.CustomCode;
              return (
                <Box
                  sx={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      size="medium"
                      sx={{
                        fontSize: "13px",
                        fontWeight: 500,
                        color: (theme) => theme.palette.grey[800],
                        maxWidth: "150px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {customCode.post_title}
                    </Typography>
                  </Box>
                  <LanguageChip mineType={customCode.metas.mime_type} />
                  <IconButton
                    className="edit-icon-btn"
                    size="small"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => openModal({ customCode })}
                    sx={{
                      opacity: 0,
                      transition: "opacity 0.15s",
                      color: (theme) => theme.palette.grey[500],
                      borderRadius: "4px",
                      padding: "3px",
                      flexShrink: 0,
                      "&:hover": {
                        backgroundColor: (theme) => theme.palette.grey[200],
                        color: (theme) => theme.palette.grey[700],
                      },
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              );
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};
