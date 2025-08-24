import {
  createContext,
  CSSProperties,
  ReactNode,
  useContext,
  useState,
} from "react";

import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import { Box, Link, SxProps } from "@mui/material";
import { styled } from "@mui/material/styles";
import MuiTable from "@mui/material/Table";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { useWPTheme } from "../ThemeRegistry";

import { useNavigation } from "@rnaga/wp-next-core/client/hooks/use-navigation";
import { useViewport } from "../hooks/use-viewport";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    // backgroundColor: theme.palette.common.black,
    // color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(even)": {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  // Apply left padding to the first cell of every row
  "& td:first-of-type, & th:first-of-type": {
    paddingLeft: 10,
  },
}));

export const Table = (props: {
  children: ReactNode;
  sx?: SxProps | undefined;
  stripe?: "even" | "odd" | "none" | undefined;
  ariaLabel?: string;
}) => {
  const { sx, stripe, ariaLabel } = props;
  return (
    <MuiTable
      // stripe={stripe ?? "odd"}
      sx={{
        // "& th": (theme) => theme.variants.soft.neutral,
        borderCollapse: "collapse",
        "& *": {
          wordWrap: "break-word",
        },
        ...(sx as any),
      }}
    >
      {props.children}
    </MuiTable>
  );
};

export const THead = (props: { children: ReactNode }) => {
  return (
    <TableHead>
      <StyledTableRow>{props.children}</StyledTableRow>
    </TableHead>
  );
};

export const Th = (props: {
  show?: boolean;
  viewport?: "desktop" | "mobile";
  children?: React.ReactNode;
  style?: CSSProperties | undefined;
  [x: string]: any;
}) => {
  const { viewport, show = true, children, style = {}, ...rest } = props;
  const currentViewport = useViewport();
  const { wpTheme } = useWPTheme();

  if (
    !show ||
    (viewport &&
      ((viewport == "mobile" && !currentViewport.isMobile) ||
        (viewport == "desktop" && !currentViewport.isDesktop)))
  ) {
    return null;
  }

  return (
    <StyledTableCell
      sx={{
        [`&.${tableCellClasses.head}`]: {
          backgroundColor: wpTheme.table.header.backgroundColor, //(theme) => theme.palette.common.black,
          color: wpTheme.table.header.color, //(theme) => theme.palette.common.white,
          px: 0,
          py: 1.5,
          mb: 1,
          fontWeight: "bold",
          // For the first cell
          "&:first-of-type": {
            pl: 1,
          },
        },
      }}
      {...{ style: { ...style, overflowWrap: "break-word" }, ...rest }}
    >
      {children}
    </StyledTableCell>
  );
};

export const Td = (props: {
  show?: boolean;
  viewport?: "desktop" | "mobile";
  children: React.ReactNode;
  style?: CSSProperties | undefined;
  size?: "small" | "medium" | "large";
  colSpan?: number;
}) => {
  const {
    show = true,
    viewport,
    children,
    style = {},
    size = "small",
    colSpan = 1,
    ...rest
  } = props;

  const currentViewport = useViewport();

  if (
    !show ||
    (viewport &&
      ((viewport == "mobile" && !currentViewport.isMobile) ||
        (viewport == "desktop" && !currentViewport.isDesktop)))
  ) {
    return null;
  }

  return (
    <StyledTableCell
      colSpan={colSpan}
      {...{
        style: {
          overflowWrap: "break-word",
          padding: 2,
          maxWidth: 250,
          ...style,
        },
        ...rest,
      }}
    >
      {children}
    </StyledTableCell>
  );
};

export const SortableTh = (props: {
  name: string | ReactNode;
  orderby: string;
  viewport?: "desktop" | "mobile";
  show?: boolean;
  style?: CSSProperties | undefined;
}) => {
  const { updateRouter, queryObject } = useNavigation();
  const { wpTheme } = useWPTheme();

  return (
    <Th
      show={props.show}
      style={{ ...props.style, alignItems: "center" }}
      viewport={props.viewport}
    >
      <Link
        component="button"
        underline="none"
        onClick={() =>
          updateRouter({
            orderby: props.orderby,
            order:
              queryObject.orderby !== props.orderby ||
              queryObject.order == "asc"
                ? "desc"
                : "asc",
          })
        }
        sx={{
          "&:hover": {
            backgroundColor: wpTheme.text.linkHoverColor,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          {props.name}{" "}
          {queryObject.orderby !== props.orderby ? (
            <ArrowDropDownIcon />
          ) : queryObject.order === "desc" ? (
            <ArrowDropDownIcon />
          ) : (
            <ArrowDropUpIcon />
          )}
        </Box>
      </Link>
    </Th>
  );
};

const TableContext = createContext<{ mouseOver: boolean }>({
  mouseOver: false,
});

export const Tr = (props: { children: ReactNode; style?: CSSProperties }) => {
  const { children, style } = props;
  const [mouseOver, setMouseOver] = useState(false);

  return (
    <TableContext.Provider value={{ mouseOver }}>
      <StyledTableRow
        sx={{
          verticalAlign: "top",
          borderBottom: "10px solid transparent",
          ...style,
        }}
        onMouseOver={() => {
          setMouseOver(true);
        }}
        onMouseLeave={() => setMouseOver(false)}
      >
        {children}
      </StyledTableRow>
    </TableContext.Provider>
  );
};

export const ActionTd = (props: {
  viewport?: "desktop" | "mobile";
  style?: CSSProperties | undefined;
  children: ReactNode[];
}) => {
  let { viewport = "desktop", style, children } = props;
  const currentViewport = useViewport();
  const { mouseOver } = useContext(TableContext);

  if (
    (viewport == "mobile" && !currentViewport.isMobile) ||
    (viewport == "desktop" && !currentViewport.isDesktop)
  ) {
    return null;
  }

  const show = viewport == "mobile" || mouseOver;

  const [first, ...rest] = children;

  children = show ? children : children?.filter((item, index) => index === 0);

  return (
    <td style={{ ...style }}>
      {first}
      <Box sx={{ minHeight: 20 }}>{show ? rest : ""}</Box>
    </td>
  );
};
