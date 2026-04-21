import { useState } from "react";

import ArticleIcon from "@mui/icons-material/Article";
import ExtensionIcon from "@mui/icons-material/Extension";
import { Box, Tooltip } from "@mui/material";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { BasicIconMenuButton } from "../../../forms/components/BasicIconMenuButton";
import { useEditorServerActions } from "../../../hooks/use-editor-server-actions";
import { useRefresh } from "../../../refresh";
import { TEMPLATE_DELETED_COMMAND } from "../../commands";
import { useTemplate } from "../../use-template";

import type * as types from "../../../../types";
import DataUsageIcon from "@mui/icons-material/DataUsage";
import MenuIcon from "@mui/icons-material/Menu";
import { logger } from "../../../../lexical/logger";

export const TemplateItem = (props: {
  template: types.Templates[number];
  openMenuId: number | null;
  onOpenMenu: (id: number) => void;
  onCloseMenu: () => void;
}) => {
  const { template, openMenuId, onOpenMenu, onCloseMenu } = props;
  const { actions } = useEditorServerActions();
  const { switchTemplate, resetTemplate, openSelectModal, current } =
    useTemplate();
  const { refresh } = useRefresh();
  const { wpHooks } = useWP();

  const [openConfirm, setOpenConfirm] = useState(false);
  const isSelected = current.id === template.ID;

  const handleEdit = () => {
    switchTemplate(template.ID);
  };

  const handleDuplicate = () => {
    actions.template.duplicate(template.ID).then(() => {
      refresh(["template"]);
    });
  };

  const handleDelete = async () => {
    await actions.template.del(template.ID);

    logger.info("Template deleted", template.ID, current.template?.ID);

    setOpenConfirm(false);

    // If the current template is the one being deleted, reset the template
    // then notify TEMPLATE_DELETED_COMMAND
    if (current.template?.ID === template.ID) {
      resetTemplate(() => {
        wpHooks.action.doCommand(TEMPLATE_DELETED_COMMAND, {
          templateId: template.ID,
        });
      });
    } else {
      // If the current template is not the one being deleted, simply notify other parts of the application
      // this will re-list the templates
      wpHooks.action.doCommand(TEMPLATE_DELETED_COMMAND, {
        templateId: template.ID,
      });
    }
  };

  return (
    <>
      <ModalConfirm
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete your template."
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        callback={(confirm) => {
          if (confirm) {
            handleDelete();
          } else {
            setOpenConfirm(false);
          }
        }}
      />
      <Box
        sx={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          gap: 1,
          userSelect: "none",
          "&:hover .hover-actions": { visibility: "visible" },
        }}
      >
        {template.useWidgetOnly ? (
          <ExtensionIcon
            sx={{ fontSize: 14, color: "#ffb74d", flexShrink: 0 }}
          />
        ) : (
          <ArticleIcon
            sx={{
              fontSize: 14,
              color: (theme) => theme.palette.grey[400],
              flexShrink: 0,
            }}
          />
        )}
        <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              minWidth: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: "12px",
                color: (theme) => theme.palette.grey[800],
                lineHeight: 1.3,
                maxWidth: "100px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "block",
              }}
            >
              {template.post_title}
            </Typography>
            {template.useWidgetOnly && (
              <Tooltip
                title="Widget only — not accessible via URL"
                placement="right"
              >
                <Box
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    px: 0.75,
                    py: "1px",
                    borderRadius: "999px",
                    backgroundColor: "rgba(255, 183, 77, 0.15)",
                    border: "1px solid rgba(255, 183, 77, 0.4)",
                    color: "#ffb74d",
                    fontSize: "9px",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    lineHeight: 1.4,
                    flexShrink: 0,
                    userSelect: "none",
                  }}
                >
                  WIDGET
                </Box>
              </Tooltip>
            )}
            {isSelected && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 0.75,
                  py: "1px",
                  borderRadius: "999px",
                  backgroundColor: (theme) => `${theme.palette.primary.main}1a`,
                  border: (theme) =>
                    `1px solid ${theme.palette.primary.main}60`,
                  color: (theme) => theme.palette.primary.main,
                  flexShrink: 0,
                  userSelect: "none",
                }}
              >
                <DataUsageIcon sx={{ fontSize: "10px" }} />
              </Box>
            )}
          </Box>
          <Typography
            sx={{
              fontSize: "10px",
              color: (theme) => theme.palette.grey[500],
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              lineHeight: 1.3,
            }}
          >
            {template.useWidgetOnly ? "widget only" : `/${template.post_name}`}
          </Typography>
        </Box>
        <Box
          className="hover-actions"
          onMouseDown={(e) => e.stopPropagation()}
          sx={{
            visibility: openMenuId === template.ID ? "visible" : "hidden",
            flexShrink: 0,
          }}
        >
          <BasicIconMenuButton
            size="small"
            icon={<MenuIcon sx={{ fontSize: 16 }} />}
            open={openMenuId === template.ID}
            onOpen={() => onOpenMenu(template.ID)}
            onClose={onCloseMenu}
            items={[
              ...(!isSelected
                ? [{ label: "Switch to this template", value: "edit" }]
                : []),
              { label: "Duplicate", value: "duplicate" },
              { label: "Delete", value: "delete" },
            ]}
            onChange={(value) => {
              switch (value) {
                case "edit":
                  handleEdit();
                  break;
                case "duplicate":
                  handleDuplicate();
                  break;
                case "delete":
                  setOpenConfirm(true);
                  break;
              }
              onCloseMenu();
            }}
          />
        </Box>
      </Box>
    </>
  );
};
