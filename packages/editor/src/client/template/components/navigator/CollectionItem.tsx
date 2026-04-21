import { useState } from "react";

import { Box, useTheme } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { SortableList } from "@rnaga/wp-next-ui/SortableList";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useEditorServerActions } from "../../../hooks/use-editor-server-actions";
import { useRefresh } from "../../../refresh";
import { useTemplate } from "../../use-template";
import { DeleteCollectionModal } from "./DeleteCollectionModal";
import { ListSectionHeader } from "./ListSectionHeader";
import { TemplateItem } from "./TemplateItem";

import type * as types from "../../../../types";

export const CollectionItem = (props: {
  item: types.PostWithCollection;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  openMenuId: number | null;
  onOpenMenu: (id: number) => void;
  onCloseMenu: () => void;
  onChildReorder: (fromIndex: number, toIndex: number) => void;
  onChildDrop: (templateId: number) => void;
  /** Called when a child item is dropped on an external target (collection header or another SortableList drop zone). */
  onChildDropToTarget: (templateId: number, targetId: string) => void;
  onDropTargetEnter?: (targetId: string) => void;
  onDropTargetLeave?: (targetId: string) => void;
  isDragOver?: boolean;
}) => {
  const {
    item,
    isFirst,
    isLast,
    onMoveUp,
    onMoveDown,
    openMenuId,
    onOpenMenu,
    onCloseMenu,
    onChildReorder,
    onChildDrop,
    onChildDropToTarget,
    onDropTargetEnter,
    onDropTargetLeave,
    isDragOver,
  } = props;

  const theme = useTheme();
  const { current } = useTemplate();
  const [expanded, setExpanded] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameName, setRenameName] = useState(item.post_title);
  const [renameError, setRenameError] = useState<string>();
  const [renameLoading, setRenameLoading] = useState(false);

  const { actions, safeParse } = useEditorServerActions();
  const { refresh } = useRefresh();

  const handleRename = async () => {
    if (!renameName) {
      setRenameError("Collection name is required");
      return;
    }
    setRenameLoading(true);
    setRenameError(undefined);
    const result = await actions.template
      .updateCollection(item.ID, renameName)
      .then(safeParse);
    if (!result.success) {
      setRenameError(`${result.error}`);
      setRenameLoading(false);
      return;
    }
    refresh(["template"]);
    setRenameLoading(false);
    setRenameModalOpen(false);
  };

  const children = item.children ?? [];

  return (
    <Box
      sx={{
        outline: isDragOver ? "2px solid #1976d2" : "none",
        outlineOffset: "-2px",
      }}
    >
      <DeleteCollectionModal
        open={deleteModalOpen}
        collectionId={item.ID}
        collectionName={item.post_title}
        onClose={() => setDeleteModalOpen(false)}
      />

      {/* Rename modal */}
      <Modal open={renameModalOpen} onClose={() => setRenameModalOpen(false)}>
        <ModalContent sx={{ minWidth: "36vw" }}>
          <Typography size="large" bold sx={{ mb: 2 }}>
            Rename Collection
          </Typography>
          <form
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              handleRename();
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              {renameError && (
                <Typography color="error">{renameError}</Typography>
              )}
              <Input
                size="large"
                placeholder="Collection Name"
                value={renameName}
                onChange={(value) => setRenameName(value)}
              />
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Button type="submit" size="medium" loading={renameLoading}>
                  Save
                </Button>
                <Button
                  type="button"
                  size="medium"
                  color="error"
                  onClick={() => setRenameModalOpen(false)}
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          </form>
        </ModalContent>
      </Modal>

      {/* Collection header */}
      <ListSectionHeader
        label={item.post_title}
        collectionId={item.ID}
        expanded={expanded}
        onToggleExpanded={() => setExpanded((v) => !v)}
        isFirst={isFirst}
        isLast={isLast}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        menuOpen={openMenuId === item.ID}
        onOpenMenu={() => onOpenMenu(item.ID)}
        onCloseMenu={onCloseMenu}
        onRename={() => {
          setRenameName(item.post_title);
          setRenameError(undefined);
          setRenameModalOpen(true);
        }}
        onDelete={() => setDeleteModalOpen(true)}
      />

      {expanded && children.length > 0 && (
        <Box
          sx={{
            //pl: 1.5,
            borderBottom: `1px solid ${theme.palette.grey[200]}`,
            backgroundColor: theme.palette.grey[50],
          }}
        >
          <SortableList
            dropZoneId={String(item.ID)}
            enum={children.map((t) => ({ value: t, label: t.post_title }))}
            displayType="vertical"
            sx={{
              py: 0,
              "& .MuiListItem-root": {
                //px: 1,
                pl: 1.5,
                py: 1,
                border: "none",
                borderBottom: `1px solid ${theme.palette.grey[100]}`,
                transition: "background-color 0.15s",
                "&:hover": {
                  backgroundColor: theme.palette.action.hover,
                },
                "&:last-child": {
                  borderBottom: "none",
                },
                "& .MuiIconButton-root": {
                  color: theme.palette.grey[400],
                  "&:hover": {
                    color: theme.palette.grey[700],
                  },
                },
              },
            }}
            onChange={(_newItems, fromIndex, toIndex) =>
              onChildReorder(fromIndex, toIndex)
            }
            onDrop={(droppedItem) => onChildDrop(droppedItem.value.ID)}
            onDropToTarget={(droppedItem, targetId) =>
              onChildDropToTarget(droppedItem.value.ID, targetId)
            }
            onDropTargetEnter={onDropTargetEnter}
            onDropTargetLeave={onDropTargetLeave}
            cursor={{ idle: "default", dragging: "default" }}
            getItemSx={(child) =>
              current.id === child.value.ID
                ? {
                    backgroundColor: `${theme.palette.primary.main}1a`,
                    borderLeft: `2px solid ${theme.palette.primary.main}`,
                  }
                : {}
            }
            renderItem={(child) => (
              <TemplateItem
                template={child.value}
                openMenuId={openMenuId}
                onOpenMenu={onOpenMenu}
                onCloseMenu={onCloseMenu}
              />
            )}
          />
        </Box>
      )}

      {expanded && children.length === 0 && (
        <Box
          data-drop-target-id={String(item.ID)}
          sx={{
            pl: 3.5,
            py: 1,
            borderBottom: `1px solid ${theme.palette.grey[200]}`,
            backgroundColor: theme.palette.grey[50],
          }}
        >
          <Typography
            size="small"
            sx={{ fontSize: "12px", color: theme.palette.grey[400] }}
          >
            No templates in this collection
          </Typography>
        </Box>
      )}
    </Box>
  );
};
