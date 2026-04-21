import { List as MuiList, ListItem as MuiListItem } from "@mui/material";

// Export List component
// This component is a simple wrapper around the Material-UI List component.
export const List = (props: Parameters<typeof MuiList>[0]) => {
  const { children, ...rest } = props;
  return <MuiList {...rest}>{children}</MuiList>;
};

export const ListItem = (props: Parameters<typeof MuiListItem>[0]) => {
  return (
    <MuiListItem
      {...props}
      sx={{
        cursor: "pointer",
        width: "100%",
        justifyContent: "flex-start",
        "&:hover": {
          backgroundColor: (theme) => theme.palette.grey[200],
        },
        ...props.sx,
      }}
    >
      {props.children}
    </MuiListItem>
  );
};
