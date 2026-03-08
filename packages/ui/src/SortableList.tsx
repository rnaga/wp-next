import { SxProps } from "@mui/material";
import { ListItemType } from "./ListBase";
import { useMouseMove } from "./hooks/use-mouse-move";
import {
  createContext,
  JSX,
  RefObject,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Box } from "@mui/material";
import { ListBase } from "./ListBase";

export type SortableListItemType<T = string> = ListItemType<T>;

type DisplayType = "vertical" | "horizontal" | "grid" | "horizontal-fit";

const SortableContext = createContext<{
  findItem: <T = string>(index: number) => SortableListItemType<T> | undefined;
  swapItems: (e: MouseEvent, fromIndex: number, toIndex: number) => void;
  targetRef: RefObject<HTMLElement | null>;
  refPos: RefObject<{
    x: number;
    y: number;
  }>;
  items: SortableListItemType<any>[];
  displayType: DisplayType;
}>({} as any);

export type SortableListProps = Parameters<typeof SortableList>[0];

export const SortableList = <T extends any = string>(props: {
  enum: { value: T; label: string }[];
  size?: "small" | "medium";
  sx?: SxProps;
  slotSxProps?: {
    label?: SxProps;
  };
  displayType: DisplayType;
  /**
   * Unique ID for this list. Used as a `data-drop-target-id` on the wrapper Box
   * so that items dragged from another SortableList can be dropped here via
   * the dragging list's `onDropToTarget` callback.
   * Also used to prevent cross-list item swapping.
   */
  dropZoneId?: string;
  renderItem?: (item: SortableListItemType<T>) => JSX.Element;
  onDelete?: (index: number) => void;
  onEdit?: (index: number) => void;
  onChange?: (
    items: SortableListItemType<T>[],
    fromIndex: number,
    toIndex: number
  ) => void;
  onDrop?: (item: SortableListItemType<T>) => void;
  onDropToTarget?: (item: SortableListItemType<T>, targetId: string) => void;
  onDropTargetEnter?: (targetId: string) => void;
  onDropTargetLeave?: (targetId: string) => void;
  cursor?: { idle?: string; dragging?: string };
}) => {
  const {
    size = "small",
    displayType = "vertical",
    renderItem,
    onDelete,
    onChange,
    onEdit,
    onDrop,
    onDropToTarget,
    onDropTargetEnter,
    onDropTargetLeave,
    cursor,
    dropZoneId,
  } = props;

  // Stable unique ID for this list instance (used to tag items)
  const generatedId = useId();
  const listId = dropZoneId ?? generatedId;

  const [items, setItems] = useState<SortableListItemType<T>[]>([]);

  const targetRef = useRef<HTMLElement | null>(null);
  const dropTargetRef = useRef<HTMLElement | null>(null);
  const refPos = useRef<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const draggedItemRef = useRef<{ index: number; element: HTMLElement } | null>(
    null
  );
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const findItem = (index: number): SortableListItemType<T> | undefined => {
    return items.find((item) => item.index === index);
  };

  const swapItems = (_e: MouseEvent, fromIndex: number, toIndex: number) => {
    const currentItems = itemsRef.current;
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= currentItems.length ||
      toIndex >= currentItems.length
    ) {
      return;
    }

    const newItems = [...currentItems];
    const temp = newItems[fromIndex];

    newItems[fromIndex] = newItems[toIndex];
    newItems[toIndex] = temp;

    newItems[fromIndex].index = fromIndex;
    newItems[toIndex].index = toIndex;

    setItems(newItems);

    onChange?.(newItems, fromIndex, toIndex);
  };

  const handleDeltaChange = (
    e: MouseEvent,
    delta: { x: number; y: number }
  ) => {
    const dragged = draggedItemRef.current;
    if (!dragged) return;

    const { element, index } = dragged;
    const rect = element.getBoundingClientRect();
    if (!rect) return;

    let newY: number;
    let newX: number;
    const transformValues: string[] = [];

    if (["horizontal", "horizontal-fit", "grid"].includes(displayType)) {
      newX = refPos.current.x + delta.x;
      transformValues.push(`translateX(${newX}px)`);
      refPos.current.x = newX;
    }

    if (displayType === "vertical" || displayType === "grid") {
      newY = refPos.current.y + delta.y;
      transformValues.push(`translateY(${newY}px)`);
      refPos.current.y = newY;
    }

    element.style.transform = transformValues.join(" ");

    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);

    let foundTarget: HTMLElement | null = null;
    for (const el of elementsAtPoint) {
      // Find the sortable item container (could be the element itself or an ancestor)
      const sortableItem = (el as HTMLElement).closest(
        "[data-sortable-item-index]"
      ) as HTMLElement | null;
      if (!sortableItem) continue;

      // Only accept items that belong to THIS list (same listId)
      if (sortableItem.getAttribute("data-sortable-list-id") !== listId) {
        continue;
      }

      const itemIndex = sortableItem.getAttribute("data-sortable-item-index");
      if (!itemIndex || itemIndex === String(index)) {
        continue;
      }

      const itemIndexNumber = parseInt(itemIndex);
      if (itemIndexNumber < 0 || itemIndexNumber >= itemsRef.current.length) {
        continue;
      }

      foundTarget = sortableItem;
      break;
    }

    if (targetRef.current && targetRef.current !== foundTarget) {
      targetRef.current.style.removeProperty("border");
    }

    if (foundTarget && foundTarget !== targetRef.current) {
      foundTarget.style.border = "1px solid red";
    }

    targetRef.current = foundTarget;

    // Check for external drop targets: both explicit [data-drop-target-id] elements
    // and foreign SortableList drop zones ([data-sortable-drop-zone-id] that differ from this list)
    {
      let foundDropTarget: HTMLElement | null = null;
      if (!foundTarget) {
        for (const el of elementsAtPoint) {
          // Look for explicit external drop targets (e.g. collection headers)
          const explicitTarget = (el as HTMLElement).closest(
            "[data-drop-target-id]"
          ) as HTMLElement | null;
          if (explicitTarget) {
            foundDropTarget = explicitTarget;
            break;
          }

          // Look for foreign SortableList drop zones (different list ID)
          const dropZone = (el as HTMLElement).closest(
            "[data-sortable-drop-zone-id]"
          ) as HTMLElement | null;
          if (
            dropZone &&
            dropZone.getAttribute("data-sortable-drop-zone-id") !== listId
          ) {
            foundDropTarget = dropZone;
            break;
          }
        }
      }

      if (dropTargetRef.current && dropTargetRef.current !== foundDropTarget) {
        const leavingId =
          dropTargetRef.current.getAttribute("data-drop-target-id") ??
          dropTargetRef.current.getAttribute("data-sortable-drop-zone-id");
        if (leavingId) onDropTargetLeave?.(leavingId);
      }

      if (foundDropTarget && foundDropTarget !== dropTargetRef.current) {
        const enteringId =
          foundDropTarget.getAttribute("data-drop-target-id") ??
          foundDropTarget.getAttribute("data-sortable-drop-zone-id");
        if (enteringId) onDropTargetEnter?.(enteringId);
      }
      dropTargetRef.current = foundDropTarget;
    }
  };

  const handleMouseDown = (_e: MouseEvent) => {
    const dragged = draggedItemRef.current;
    if (!dragged) return;

    const { element } = dragged;
    refPos.current.y = 0;
    refPos.current.x = 0;
    element.style.zIndex = "100000";
  };

  const handleMouseUp = (e: MouseEvent) => {
    const dragged = draggedItemRef.current;
    if (!dragged) return;

    const { element, index } = dragged;
    refPos.current.y = 0;
    refPos.current.x = 0;
    element.style.removeProperty("transform");
    element.style.removeProperty("z-index");

    if (targetRef.current) {
      const toItemIndex = targetRef.current.getAttribute(
        "data-sortable-item-index"
      );
      swapItems(e, index, toItemIndex ? parseInt(toItemIndex) : -1);
      targetRef.current.style.removeProperty("border");
      targetRef.current = null;
    } else if (dropTargetRef.current) {
      // Dropped onto an external drop target or foreign SortableList drop zone
      const targetId =
        dropTargetRef.current.getAttribute("data-drop-target-id") ??
        dropTargetRef.current.getAttribute("data-sortable-drop-zone-id");
      const droppedItem = itemsRef.current.find((i) => i.index === index);
      if (droppedItem && targetId) {
        onDropToTarget?.(droppedItem, targetId);
      }
      onDropTargetLeave?.(targetId ?? "");
      dropTargetRef.current = null;
    } else {
      // Check if the drop point is still within this list's own drop zone.
      // If so, the item was dropped on empty space inside the same list — no-op.
      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
      const isInsideOwnDropZone = elementsAtPoint.some((el) => {
        const dropZone = (el as HTMLElement).closest(
          "[data-sortable-drop-zone-id]"
        ) as HTMLElement | null;
        return (
          dropZone &&
          dropZone.getAttribute("data-sortable-drop-zone-id") === listId
        );
      });

      if (!isInsideOwnDropZone) {
        // Dropped outside any list or target — fire onDrop
        const droppedItem = itemsRef.current.find((i) => i.index === index);
        if (droppedItem) {
          onDrop?.(droppedItem);
        }
      }
    }

    draggedItemRef.current = null;
  };

  const { initMouseMove } = useMouseMove({
    onDeltaChange: handleDeltaChange,
    onMouseUp: handleMouseUp,
    onMouseDown: handleMouseDown,
    cursor: cursor?.dragging ?? "grabbing",
    threshold: 1,
  });

  useEffect(() => {
    const initialItems = props.enum.map((item, index) => ({
      index,
      value: item.value,
      label: item.label,
      ref: null,
    }));
    setItems(initialItems);
  }, [props.enum]);

  const sx = useMemo<SxProps>(() => {
    if (
      props.displayType === "horizontal" ||
      props.displayType === "horizontal-fit"
    ) {
      return { display: "flex", flexDirection: "row" };
    }
    if (props.displayType === "grid") {
      return {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
        gap: 1,
      };
    }
    return {};
  }, [props.displayType]);

  const handleItemMouseDown = (
    item: SortableListItemType<T>,
    e: React.MouseEvent
  ) => {
    // Find the MuiListItem parent element
    const listItemElement = (e.target as HTMLElement).closest(
      "[data-sortable-item-index]"
    ) as HTMLElement | null;

    if (listItemElement) {
      itemRefs.current.set(item.index, listItemElement);
      draggedItemRef.current = { index: item.index, element: listItemElement };
      initMouseMove(listItemElement)(e);
    }
  };

  return (
    <SortableContext.Provider
      value={{
        items,
        findItem: findItem as any,
        swapItems,
        refPos,
        targetRef,
        displayType,
      }}
    >
      <Box data-sortable-drop-zone-id={listId}>
        <ListBase
          items={items}
          size={size}
          sx={{ ...sx, ...props.sx }}
          displayType={displayType}
          renderItem={(item) =>
            renderItem ? renderItem(item) : <>{item.label}</>
          }
          onDelete={onDelete}
          onEdit={onEdit}
          onMouseDown={handleItemMouseDown as any}
          getItemDataAttributes={(item) => ({
            "data-sortable-item-index": item.index,
            "data-sortable-list-id": listId,
          })}
          slotSxProps={{
            listItem: {
              cursor: cursor?.idle ?? "move",
            },
          }}
        />
      </Box>
    </SortableContext.Provider>
  );
};
