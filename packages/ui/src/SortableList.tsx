import { Box, SxProps } from "@mui/material";
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

  const findItem = (index: number): SortableListItemType<T> | undefined => {
    return items.find((item) => item.index === index);
  };

  const swapItems = (_e: MouseEvent, fromIndex: number, toIndex: number) => {
    console.log("Swapping items", fromIndex, toIndex);
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= items.length ||
      toIndex >= items.length
    ) {
      return;
    }

    const newItems = [...items];
    const temp = newItems[fromIndex];

    newItems[fromIndex] = newItems[toIndex];
    newItems[toIndex] = temp;

    newItems[fromIndex].index = fromIndex;
    newItems[toIndex].index = toIndex;

    setItems(newItems);

    onChange?.(newItems);
  };

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

  const renderSortableItem = (item: SortableListItemType<T>) => {
    return (
      <Box
        ref={item.ref as RefObject<HTMLDivElement>}
        onMouseDown={initMouseMoveForItem(item)}
        data-sortable-item-index={item.index}
        sx={{
          cursor: "move",
        }}
      >
        {renderItem ? renderItem(item) : item.label}
      </Box>
    );
  };

  const initMouseMoveForItem = (item: SortableListItemType<T>) => {
    const ref = item.ref;
    if (!ref) return () => {};

    const handleDeltaChange = (
      e: MouseEvent,
      delta: { x: number; y: number }
    ) => {
      const rect = ref.current?.getBoundingClientRect();
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

      (ref.current as HTMLElement).style.transform = transformValues.join(" ");

      const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);

      for (const element of elementsAtPoint) {
        const itemIndex = element.getAttribute("data-sortable-item-index");

        if (!itemIndex || itemIndex === String(item.index)) {
          if (targetRef.current) {
            targetRef.current.style.removeProperty("border");
            targetRef.current = null;
          }
          continue;
        }

        const itemIndexNumber = parseInt(itemIndex);
        if (itemIndexNumber < 0 || itemIndexNumber >= items.length) continue;

        if (targetRef.current) {
          targetRef.current.style.removeProperty("border");
        }

        targetRef.current = element as HTMLElement;
        targetRef.current.style.border = "1px solid red";
        break;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      const rect = ref.current?.getBoundingClientRect();
      if (rect) {
        refPos.current.y = e.clientY - rect.top - rect.height / 2;
        refPos.current.x = 0;
        (ref.current as HTMLElement).style.zIndex = "100000";
        (ref.current as HTMLElement).style.transform = `translate(${refPos.current.x}px, ${refPos.current.y}px)`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      refPos.current.y = 0;
      refPos.current.x = 0;
      (ref.current as HTMLElement)?.style.removeProperty("transform");
      (ref.current as HTMLElement)?.style.removeProperty("z-index");

      if (targetRef.current) {
        const toItemIndex = targetRef.current.getAttribute("data-sortable-item-index");
        swapItems(e, item.index, toItemIndex ? parseInt(toItemIndex) : -1);
        targetRef.current?.style.removeProperty("border");
        targetRef.current = null;
      }
    };

    const { initMouseMove } = useMouseMove({
      onDeltaChange: handleDeltaChange,
      onMouseUp: handleMouseUp,
      onMouseDown: handleMouseDown,
      cursor: "grabbing",
      threshold: 1,
    });

    return initMouseMove(ref);
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
      />
    </SortableContext.Provider>
  );
};
