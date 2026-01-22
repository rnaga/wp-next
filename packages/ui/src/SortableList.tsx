import { SxProps } from "@mui/material";
import { ListItemType } from "./ListBase";
import { useMouseMove } from "./hooks/use-mouse-move";
import {
  createContext,
  JSX,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
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
  renderItem?: (item: SortableListItemType<T>) => JSX.Element;
  onDelete?: (index: number) => void;
  onEdit?: (index: number) => void;
  onChange?: (items: SortableListItemType<T>[]) => void;
}) => {
  const {
    size = "small",
    displayType = "vertical",
    renderItem,
    onDelete,
    onChange,
    onEdit,
  } = props;

  const [items, setItems] = useState<SortableListItemType<T>[]>([]);

  const targetRef = useRef<HTMLElement | null>(null);
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
    console.log("Swapping items", fromIndex, toIndex);
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

    onChange?.(newItems);
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

      const itemIndex = sortableItem.getAttribute("data-sortable-item-index");
      if (!itemIndex || itemIndex === String(index)) continue;

      const itemIndexNumber = parseInt(itemIndex);
      if (itemIndexNumber < 0 || itemIndexNumber >= itemsRef.current.length)
        continue;

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
  };

  const handleMouseDown = (e: MouseEvent) => {
    const dragged = draggedItemRef.current;
    if (!dragged) return;

    const { element, index } = dragged;
    console.log("Mouse down on item", index);
    const rect = element.getBoundingClientRect();
    if (rect) {
      refPos.current.y = e.clientY - rect.top - rect.height / 2;
      refPos.current.x = 0;
      element.style.zIndex = "100000";
      element.style.transform = `translate(${refPos.current.x}px, ${refPos.current.y}px)`;
    }
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
      targetRef.current?.style.removeProperty("border");
      targetRef.current = null;
    }

    draggedItemRef.current = null;
  };

  const { initMouseMove } = useMouseMove({
    onDeltaChange: handleDeltaChange,
    onMouseUp: handleMouseUp,
    onMouseDown: handleMouseDown,
    cursor: "grabbing",
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

  let sx: SxProps = {};
  if (props.displayType === "horizontal") {
    sx = {
      display: "flex",
      flexDirection: "row",
    };
  } else if (props.displayType === "horizontal-fit") {
    sx = {
      display: "flex",
      flexDirection: "row",
    };
  } else if (props.displayType === "grid") {
    sx = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: 1,
    };
  }

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

  const renderSortableItem = (item: SortableListItemType<T>) => {
    return renderItem ? renderItem(item) : item.label;
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
      <ListBase
        items={items}
        size={size}
        sx={{ ...sx, ...props.sx }}
        displayType={displayType}
        renderItem={renderSortableItem as any}
        onDelete={onDelete}
        onEdit={onEdit}
        onMouseDown={handleItemMouseDown as any}
        getItemDataAttributes={(item) => ({
          "data-sortable-item-index": item.index,
        })}
        slotSxProps={{
          listItem: {
            cursor: "move",
          },
        }}
      />
    </SortableContext.Provider>
  );
};
