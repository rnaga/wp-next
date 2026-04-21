import { useState, useTransition } from "react";

import { Box, LinearProgress, useTheme } from "@mui/material";
import { SortableList } from "@rnaga/wp-next-ui/SortableList";

import { useEditorServerActions } from "../../../hooks/use-editor-server-actions";
import { useRefresh } from "../../../refresh";
import { CollectionItem } from "./CollectionItem";
import { ListSectionHeader } from "./ListSectionHeader";
import { TemplateItem } from "./TemplateItem";
import { useTemplate } from "../../use-template";

import type * as types from "../../../../types";
import {
  TEMPLATE_COLLECTION_POST_TYPE,
  TEMPLATE_POST_TYPE,
} from "../../../../lexical/constants";

const TOP_LEVEL_DROP_ZONE_ID = "top-level";

/**
 * NavigatorList renders templates and collections.
 *
 * Architecture:
 * - Top-level templates (General) are rendered first in their own SortableList.
 * - Collections are rendered below, each as a plain row (not inside a SortableList).
 *   They use move-up / move-down buttons for reordering within the collections list.
 * - Each collection contains its own SortableList for its child templates.
 * - When a child template is dropped outside its collection's SortableList
 *   (via onDrop), it is moved to top level (post_parent = 0).
 */
export const NavigatorList = (props: {
  items: types.PostWithCollection[];
  isSearching?: boolean;
}) => {
  const { items, isSearching = false } = props;
  const theme = useTheme();
  const { actions } = useEditorServerActions();
  const { refresh } = useRefresh();
  const { current } = useTemplate();

  const [loading, startTransition] = useTransition();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [highlightedTargetId, setHighlightedTargetId] = useState<string | null>(
    null
  );
  const [uncategorizedExpanded, setUncategorizedExpanded] = useState(true);

  const collections = items.filter((item) => item.isCollection);
  const topLevelTemplates = items.filter((item) => !item.isCollection);

  const handleTopLevelReorder = (fromIndex: number, toIndex: number) => {
    const dragged = topLevelTemplates[fromIndex];
    const target = topLevelTemplates[toIndex];
    startTransition(async () => {
      const newOrder =
        target.menu_order > dragged.menu_order
          ? target.menu_order + 1
          : target.menu_order;
      await actions.template.changeOrder(
        dragged.ID,
        newOrder,
        TEMPLATE_POST_TYPE
      );
      refresh(["template"]);
    });
  };

  const handleCollectionMoveUp = (collectionIndex: number) => {
    if (collectionIndex <= 0) {
      return;
    }

    const collection = collections[collectionIndex];
    const above = collections[collectionIndex - 1];

    if (!collection || !above) {
      return;
    }

    startTransition(async () => {
      await actions.template.swapOrder(
        above.ID,
        collection.ID,
        TEMPLATE_COLLECTION_POST_TYPE
      );
      refresh(["template"]);
    });
  };

  const handleCollectionMoveDown = (collectionIndex: number) => {
    if (collectionIndex >= collections.length - 1) {
      return;
    }

    const collection = collections[collectionIndex];
    const below = collections[collectionIndex + 1];

    if (!collection || !below) {
      return;
    }

    startTransition(async () => {
      await actions.template.swapOrder(
        collection.ID,
        below.ID,
        TEMPLATE_COLLECTION_POST_TYPE
      );
      refresh(["template"]);
    });
  };

  const handleChildReorder = (
    children: types.Templates,
    fromIndex: number,
    toIndex: number
  ) => {
    const dragged = children[fromIndex];
    const target = children[toIndex];
    startTransition(async () => {
      // When dragging downward, shift the target item up by 1 first so the
      // dragged item lands directly above it after taking its original order.
      // if (target.menu_order > dragged.menu_order) {
      //   await actions.template.changeOrder(target.ID, target.menu_order - 1, TEMPLATE_POST_TYPE);
      // }

      const newOrder =
        target.menu_order > dragged.menu_order
          ? target.menu_order + 1
          : target.menu_order;
      await actions.template.changeOrder(
        dragged.ID,
        newOrder,
        TEMPLATE_POST_TYPE
      );
      refresh(["template"]);
    });
  };

  const handleChildDrop = (templateId: number) => {
    startTransition(async () => {
      await actions.template.moveToCollection(templateId, null);
      refresh(["template"]);
    });
  };

  const handleDropToCollection = (templateId: number, collectionId: number) => {
    startTransition(async () => {
      await actions.template.moveToCollection(templateId, collectionId);
      refresh(["template"]);
    });
  };

  /**
   * Handles drops onto external targets for the top-level SortableList.
   * targetId is either a collection ID (numeric string) from [data-drop-target-id]
   * or a child SortableList drop zone ID (also a collection ID numeric string
   * from [data-sortable-drop-zone-id]).
   */
  const handleTopLevelDropToTarget = (
    droppedItem: { value: types.PostWithCollection },
    targetId: string
  ) => {
    const collectionId = parseInt(targetId);
    if (!isNaN(collectionId)) {
      handleDropToCollection(droppedItem.value.ID, collectionId);
    }
  };

  /**
   * Handles drops onto external targets for child SortableLists.
   * targetId is either:
   * - TOP_LEVEL_DROP_ZONE_ID → move to top level
   * - another collection's numeric ID → move to that collection
   * - a collection header's data-drop-target-id (same as collection ID)
   */
  const handleChildDropToTarget = (
    templateId: number,
    targetId: string,
    currentCollectionId: number
  ) => {
    if (targetId === TOP_LEVEL_DROP_ZONE_ID) {
      handleChildDrop(templateId);
      return;
    }

    const collectionId = parseInt(targetId);
    if (!isNaN(collectionId) && collectionId !== currentCollectionId) {
      handleDropToCollection(templateId, collectionId);
    }
  };

  const listItemSx = {
    px: 1.5,
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
      "&:hover": { color: theme.palette.grey[700] },
    },
  };

  if (isSearching) {
    return (
      <Box>
        {items.map((item) => (
          <Box key={item.ID} sx={listItemSx}>
            <TemplateItem
              template={item}
              openMenuId={openMenuId}
              onOpenMenu={(id) => setOpenMenuId(id)}
              onCloseMenu={() => setOpenMenuId(null)}
            />
          </Box>
        ))}
      </Box>
    );
  }

  return (
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
        {/* Top-level templates section */}
        {topLevelTemplates.length > 0 && (
          <Box
            sx={{
              outline:
                highlightedTargetId === TOP_LEVEL_DROP_ZONE_ID
                  ? "2px solid #1976d2"
                  : "none",
              outlineOffset: "-2px",
            }}
          >
            <ListSectionHeader
              label="General"
              expanded={uncategorizedExpanded}
              onToggleExpanded={() => setUncategorizedExpanded((v) => !v)}
            />
            {uncategorizedExpanded && (
              <SortableList
                dropZoneId={TOP_LEVEL_DROP_ZONE_ID}
                enum={topLevelTemplates.map((t) => ({
                  value: t,
                  label: t.post_title,
                }))}
                displayType="vertical"
                sx={{
                  py: 0,
                  "& .MuiListItem-root": listItemSx,
                }}
                onChange={(_newItems, fromIndex, toIndex) =>
                  handleTopLevelReorder(fromIndex, toIndex)
                }
                onDropToTarget={(droppedItem, targetId) =>
                  handleTopLevelDropToTarget(droppedItem, targetId)
                }
                onDropTargetEnter={(targetId) =>
                  setHighlightedTargetId(targetId)
                }
                onDropTargetLeave={() => setHighlightedTargetId(null)}
                cursor={{ idle: "default", dragging: "default" }}
                getItemSx={(listItem) =>
                  current.id === listItem.value.ID
                    ? {
                        backgroundColor: `${theme.palette.primary.main}1a`,
                        borderLeft: `2px solid ${theme.palette.primary.main}`,
                      }
                    : {}
                }
                renderItem={(listItem) => (
                  <TemplateItem
                    template={listItem.value}
                    openMenuId={openMenuId}
                    onOpenMenu={(id) => setOpenMenuId(id)}
                    onCloseMenu={() => setOpenMenuId(null)}
                  />
                )}
              />
            )}
          </Box>
        )}

        {/* Collections section */}
        {collections.map((item, collectionIndex) => (
          <CollectionItem
            key={item.ID}
            item={item}
            isFirst={collectionIndex === 0}
            isLast={collectionIndex === collections.length - 1}
            onMoveUp={() => handleCollectionMoveUp(collectionIndex)}
            onMoveDown={() => handleCollectionMoveDown(collectionIndex)}
            openMenuId={openMenuId}
            onOpenMenu={(id) => setOpenMenuId(id)}
            onCloseMenu={() => setOpenMenuId(null)}
            onChildReorder={(from, to) =>
              handleChildReorder(item.children ?? [], from, to)
            }
            onChildDrop={handleChildDrop}
            onChildDropToTarget={(droppedTemplateId, targetId) =>
              handleChildDropToTarget(droppedTemplateId, targetId, item.ID)
            }
            onDropTargetEnter={(targetId) => setHighlightedTargetId(targetId)}
            onDropTargetLeave={() => setHighlightedTargetId(null)}
            isDragOver={highlightedTargetId === String(item.ID)}
          />
        ))}
      </Box>
    </Box>
  );
};
