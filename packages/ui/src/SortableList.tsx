import { Box, IconButton, List, ListItem, SxProps } from "@mui/material";
import { Typography } from "./Typography";
import { useMouseMove } from "./hooks/use-mouse-move";
import {
  createContext,
  JSX,
  RefObject,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

// import Delete icon
import { Delete } from "@mui/icons-material";
import { Close } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import { useWPTheme } from "./ThemeRegistry";

export type SortableListItemType<T = string> = {
  index: number;
  value: T;
  label: string;
  ref: RefObject<HTMLElement | null>;
};

type DisplayType = "vertical" | "horizontal" | "grid" | "horizontal-fit";

const Context = createContext<{
  findItem: <T = string>(index: number) => SortableListItemType<T> | undefined;
  swapItems: (e: MouseEvent, fromIndex: number, toIndex: number) => void;
  targetRef: RefObject<HTMLElement | null>;
  refPos: RefObject<{
    x: number;
    y: number;
  }>;
  items: SortableListItemType<any>[];
  displayType: DisplayType;
  renderItem?: <T = string>(item: SortableListItemType<T>) => JSX.Element;
  onDelete?: (index: number) => void;
  onEdit?: (index: number) => void;
}>({} as any);

const SortableListItem = (props: {
  index: number;
  size: "small" | "medium";
}) => {
  const { index, size } = props;
  const ref = useRef<HTMLLIElement | null>(null);

  const {
    findItem,
    swapItems,
    refPos,
    targetRef,
    items,
    displayType,
    renderItem,
    onDelete,
    onEdit,
  } = useContext(Context);

  const item = findItem(index);
  const { wpTheme } = useWPTheme();

  const handleDeltaChange = (
    e: MouseEvent,
    delta: { x: number; y: number }
  ) => {
    // Get the rect of the item being dragged
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      console.warn(
        "SortableListItem ref is not set or does not have a bounding rect."
      );
      return;
    }
    let newY,
      newX,
      transformValues: string[] = [];

    //if (displayType === "horizontal" || displayType === "grid") {
    if (["horizontal", "horizontal-fit", "grid"].includes(displayType)) {
      newX = refPos.current.x + delta.x; // Update the X position relative to the element
      transformValues.push(`translateX(${newX}px)`);

      refPos.current.x = newX; // Update the reference position
    }

    if (displayType === "vertical" || displayType === "grid") {
      newY = refPos.current.y + delta.y; // Update the Y position relative to the element
      transformValues.push(`translateY(${newY}px)`);
      refPos.current.y = newY; // Update the reference position
    }

    ref.current.style.transform = transformValues.join(" ");

    // Get elements on the currrent moust position
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);

    // timeoutId.current = setTimeout(() => {
    for (const element of elementsAtPoint) {
      // get the data attribute
      const itemIndex = element.getAttribute("data-sortable-item-index");

      if (!itemIndex) {
        // Skip if the element does not have the data attribute
        continue;
      }

      // Skip if itemValue is null or the same as the current value
      if (itemIndex === String(index)) {
        if (targetRef.current) {
          targetRef.current.style.removeProperty("border");
          targetRef.current = null;
        }
        continue;
      }

      const itemIndexNumber = parseInt(itemIndex);
      if (itemIndexNumber < 0 || itemIndexNumber >= items.length) {
        continue; // Skip invalid indices
      }

      if (targetRef.current) {
        targetRef.current.style.removeProperty("border");
      }

      targetRef.current = element as HTMLElement;
      targetRef.current.style.border = "1px solid red";

      break;
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    console.log("mouse down on item", index, e);
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      refPos.current.y = e.clientY - rect.top - rect.height / 2; // Calculate the initial Y offset
      refPos.current.x = 0;
      ref.current.style.zIndex = "100000"; // Bring the item to the front
      ref.current.style.transform = `translate(${refPos.current.x}px, ${refPos.current.y}px)`;
    }
  };

  const handleMouseUp = (e: MouseEvent) => {
    refPos.current.y = 0; // Reset Y position
    refPos.current.x = 0; // Reset X position
    ref.current?.style.removeProperty("transform");
    ref.current?.style.removeProperty("z-index");

    if (targetRef.current) {
      const toItemIndex = targetRef.current.getAttribute(
        "data-sortable-item-index"
      );
      swapItems(e, index, toItemIndex ? parseInt(toItemIndex) : -1);
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

  // Assign the ref to the item
  useEffect(() => {
    item.ref = ref;
  }, [item]);

  return (
    <ListItem
      ref={ref as RefObject<HTMLLIElement>}
      value={item.value}
      onMouseDown={initMouseMove(ref)}
      // Set data attribute to identify the item
      data-sortable-item-index={index}
      sx={{
        position: "relative",
        cursor: "move",
        "&:hover": {
          backgroundColor: wpTheme.background.hoverColor, // Use theme hover color
        },
        border: (theme) => `1px solid ${theme.palette.divider}`,
        p: 0,
        width: displayType === "horizontal" ? "auto" : "100%",
        display: "flex",
      }}
    >
      <Box sx={{ flexGrow: 1, display: "flex", alignItems: "center" }}>
        {renderItem ? (
          renderItem(item)
        ) : (
          <Typography
            size={size}
            sx={{
              p: 0.5,
            }}
          >
            {item.label}
          </Typography>
        )}
      </Box>

      {onEdit && (
        <IconButton
          size="small"
          sx={{
            height: "100%",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            onEdit?.(index);
          }}
        >
          <EditIcon
            sx={{
              fontSize: size === "small" ? "small" : "medium",
            }}
          />
        </IconButton>
      )}
      {onDelete && (
        <IconButton
          size="small"
          sx={{
            height: "100%",
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            console.log("Removing item at index", index);
            onDelete?.(index);
          }}
        >
          <Close
            sx={{
              fontSize: size === "small" ? "small" : "medium",
            }}
          />
        </IconButton>
      )}
    </ListItem>
  );
};

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

  const swapItems = (e: MouseEvent, fromIndex: number, toIndex: number) => {
    console.log("Swapping items", fromIndex, toIndex);
    if (
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= items.length ||
      toIndex >= items.length
    ) {
      return;
    }

    // Swap items in the state
    const newItems = [...items];
    const temp = newItems[fromIndex];

    newItems[fromIndex] = newItems[toIndex];
    newItems[toIndex] = temp;

    newItems[fromIndex].index = fromIndex; // Update index after swap
    newItems[toIndex].index = toIndex; // Update index after swap

    setItems(newItems);

    onChange?.(newItems);
  };

  useEffect(() => {
    // Initialize items from the enum prop
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

  return (
    <Context
      value={{
        items,
        findItem: findItem as any,
        swapItems,
        refPos,
        targetRef,
        displayType,
        renderItem: renderItem as any,
        onDelete,
        onEdit,
      }}
    >
      <List sx={{ ...sx, ...props.sx }}>
        {items.map((item, index) => (
          <SortableListItem index={index} key={item.index} size={size} />
        ))}
      </List>
    </Context>
  );
};
