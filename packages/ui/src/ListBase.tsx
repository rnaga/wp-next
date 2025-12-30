import {
  Box,
  IconButton,
  List as MuiList,
  ListItem as MuiListItem,
  SxProps,
} from "@mui/material";
import { Typography } from "./Typography";
import {
  createContext,
  JSX,
  RefObject,
  useContext,
  useRef,
  useState,
} from "react";
import { Close } from "@mui/icons-material";
import EditIcon from "@mui/icons-material/Edit";
import { useWPTheme } from "./ThemeRegistry";

export type ListItemType<T = string> = {
  index: number;
  value: T;
  label: string;
  ref?: RefObject<HTMLElement | null>;
};

type DisplayType = "vertical" | "horizontal" | "grid" | "horizontal-fit";

type ListItemEventHandlers<T = string> = {
  onClick?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  onMouseDown?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  onMouseUp?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  onMouseEnter?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  onMouseLeave?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  onDoubleClick?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  onContextMenu?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  onMouseOver?: (item: ListItemType<T>, event: React.MouseEvent) => void;
};

type ListContextType<T = string> = {
  items: ListItemType<T>[];
  displayType: DisplayType;
  renderItem?: (item: ListItemType<T>) => JSX.Element;
  onDelete?: (index: number) => void;
  onEdit?: (index: number) => void;
  itemEventHandlers?: ListItemEventHandlers<T>;
  getItemSx?: (item: ListItemType<T>, index: number) => SxProps;
  slotSxProps?: {
    listItem?: SxProps;
  };
  editable: boolean;
};

const ListContext = createContext<ListContextType<any>>({} as any);

export const ListItem = (props: {
  item: ListItemType<any>;
  index: number;
  size: "small" | "medium";
  dataAttributes?: Record<string, string | number>;
  sx?: SxProps;
}) => {
  const { item, index, size, dataAttributes, sx } = props;
  const ref = useRef<HTMLLIElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const {
    displayType,
    renderItem,
    onDelete,
    onEdit,
    itemEventHandlers,
    getItemSx,
    slotSxProps,
    editable,
  } = useContext(ListContext);

  const { wpTheme } = useWPTheme();

  const handleEvent = (
    handler?: (item: ListItemType<any>, event: React.MouseEvent) => void
  ) => {
    return handler
      ? (event: React.MouseEvent) => handler(item, event)
      : undefined;
  };

  const handleMouseEnter = (event: React.MouseEvent) => {
    setIsHovered(true);
    itemEventHandlers?.onMouseEnter?.(item, event);
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    setIsHovered(false);
    itemEventHandlers?.onMouseLeave?.(item, event);
  };

  const customSx = {
    ...(getItemSx ? getItemSx(item, index) : {}),
    ...(slotSxProps?.listItem || {}),
    ...sx,
  } as SxProps;

  return (
    <MuiListItem
      ref={ref}
      value={item.value}
      onClick={handleEvent(itemEventHandlers?.onClick)}
      onMouseDown={handleEvent(itemEventHandlers?.onMouseDown)}
      onMouseUp={handleEvent(itemEventHandlers?.onMouseUp)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onDoubleClick={handleEvent(itemEventHandlers?.onDoubleClick)}
      onContextMenu={handleEvent(itemEventHandlers?.onContextMenu)}
      onMouseOver={handleEvent(itemEventHandlers?.onMouseOver)}
      {...(dataAttributes || {})}
      sx={{
        position: "relative",
        "&:hover": {
          backgroundColor: wpTheme.background.hoverColor,
        },
        border: (theme) => `1px solid ${theme.palette.divider}`,
        p: 0,
        width: displayType === "horizontal" ? "auto" : "100%",
        display: "flex",
        ...customSx,
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

      {(onEdit || editable) && isHovered && (
        <IconButton
          size="small"
          sx={{
            height: "100%",
          }}
          onMouseDown={(e) => {
            onEdit && e.stopPropagation();
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
    </MuiListItem>
  );
};

export type ListBaseProps<T = string> = {
  items: { value: T; label: string }[];
  size?: "small" | "medium";
  sx?: SxProps;
  displayType?: DisplayType;
  renderItem?: (item: ListItemType<T>) => JSX.Element;
  onDelete?: (index: number) => void;
  onEdit?: (index: number) => void;
  editable?: boolean;
  onClick?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  onMouseDown?: (item: ListItemType<T>, event: React.MouseEvent) => void;
  itemEventHandlers?: ListItemEventHandlers<T>;
  getItemSx?: (item: ListItemType<T>, index: number) => SxProps;
  dataAttributes?: Record<string, string | number>;
  slotSxProps?: {
    listItem?: SxProps;
  };
};

export const ListBase = <T extends any = string>(props: ListBaseProps<T>) => {
  const {
    items,
    size = "small",
    displayType = "vertical",
    renderItem,
    onDelete,
    onEdit,
    onClick,
    onMouseDown,
    itemEventHandlers,
    getItemSx,
    dataAttributes,
    slotSxProps,
    editable = false,
  } = props;

  const listItems: ListItemType<T>[] = items.map((item, index) => ({
    index,
    value: item.value,
    label: item.label,
  }));

  let sx: SxProps = {};
  if (displayType === "horizontal") {
    sx = {
      display: "flex",
      flexDirection: "row",
    };
  } else if (displayType === "horizontal-fit") {
    sx = {
      display: "flex",
      flexDirection: "row",
    };
  } else if (displayType === "grid") {
    sx = {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
      gap: 1,
    };
  }

  // Merge standalone onClick/onMouseDown/onMouseOver with itemEventHandlers
  const mergedEventHandlers: ListItemEventHandlers<T> = {
    ...itemEventHandlers,
    onClick: onClick || itemEventHandlers?.onClick,
    onMouseDown: onMouseDown || itemEventHandlers?.onMouseDown,
  };

  return (
    <ListContext.Provider
      value={{
        items: listItems as ListItemType<any>[],
        displayType,
        renderItem: renderItem as any,
        onDelete,
        onEdit,
        itemEventHandlers: mergedEventHandlers as any,
        getItemSx: getItemSx as any,
        slotSxProps,
        editable,
      }}
    >
      <MuiList sx={{ ...sx, ...props.sx }}>
        {listItems.map((item, index) => (
          <ListItem
            item={item}
            index={index}
            key={item.index}
            size={size}
            dataAttributes={dataAttributes}
            sx={slotSxProps?.listItem}
          />
        ))}
      </MuiList>
    </ListContext.Provider>
  );
};
