/// <reference types="../../types/post.d.ts" />

import { useCallback, useState } from "react";

import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import { Box } from "@mui/material";
import { Input } from "@rnaga/wp-next-ui/Input";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { BasicIconMenuButton } from "../forms/components/BasicIconMenuButton";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { useTemplate } from "./use-template";
import { NavigatorList } from "./components/navigator/NavigatorList";

export const TemplateNavigator = () => {
  const { actions } = useEditorServerActions();
  const {
    openCreateModal,
    openCreateCollectionModal,
    templates,
    setTemplates,
  } = useTemplate();
  const { wpTheme } = useWPTheme();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(
    async (value: string) => {
      if (value.length === 0) {
        setIsSearching(false);
        // If search is cleared, reset to full list
        const result = await actions.template.listWithCollection();
        if (result.success && result.data) {
          setTemplates(result.data);
        }
        return;
      }

      setIsSearching(true);
      const result = await actions.template.list({ search: value });
      if (result.success && result.data) {
        // Map flat list to PostWithCollection (all standalone)
        const mapped = result.data.map((t) => ({
          ...t,
          isCollection: false as const,
        }));
        setTemplates(mapped);
      }
    },
    [actions, setTemplates]
  );

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
            Templates
          </Typography>
          <BasicIconMenuButton
            size="small"
            icon={<AddIcon sx={{ fontSize: 18 }} />}
            label="Add new"
            items={[
              { label: "New Template", value: "template" },
              { label: "New Collection", value: "collection" },
            ]}
            onChange={(value) => {
              if (value === "template") {
                openCreateModal();
              } else if (value === "collection") {
                openCreateCollectionModal();
              }
            }}
            slotProps={{
              tooltip: {
                title: "Add new template or collection",
                placement: "right",
              },
            }}
          />
        </Box>

        <Box sx={{ px: 1.5, py: 1.5 }}>
          <Input
            placeholder="Search templates..."
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

      <NavigatorList items={templates ?? []} isSearching={isSearching} />
    </Box>
  );
};
