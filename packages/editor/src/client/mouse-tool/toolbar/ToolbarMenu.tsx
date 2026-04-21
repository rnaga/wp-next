import React from "react";
import { Box, Button, ClickAwayListener, List, ListItem } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { useToolBox } from "../toolbox/ToolBoxContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { ToolbarButton } from "./ToolbarButton";
import { useSelectedNode } from "../../global-event";

export const ToolbarMenu = () => {
  const { wpTheme } = useWPTheme();
  const { menus } = useToolBox();

  const items = menus.get();
  if (items.length === 0) return null;

  return (
    <>
      <ToolbarButton
        title="Menus"
        sx={{ position: "relative" }}
        onClick={() => menus.toggle()}
      >
        <MenuIcon />
      </ToolbarButton>

      {menus.isOpen && (
        <ClickAwayListener onClickAway={() => menus.close()}>
          <Box
            sx={{
              position: "absolute",
              mt: 1,
              top: 24,
              left: 32,
              display: "flex",
              flexDirection: "column",
              border: `1px solid ${wpTheme.mousetoolBox.borderColor}`,
              backgroundColor: wpTheme.mousetoolBox.backgroundColor,
              zIndex: wpTheme.zIndex.mousetool + 10,
            }}
          >
            <List sx={{ maxWidth: 300, borderRadius: "none", border: "none" }}>
              {items.map(([menu, func], index) => (
                <ListItem
                  key={index}
                  sx={{
                    padding: 0.5,
                    margin: 0,
                    borderRadius: 0,
                    "&:hover": {
                      backgroundColor:
                        wpTheme.mousetoolBox.hover.backgroundColor,
                    },
                  }}
                >
                  <Box
                    component={Button}
                    sx={{
                      textTransform: "none",
                      minHeight: 0,
                      borderRadius: 0,
                      m: 0,
                      p: 0.5,
                      paddingBlock: 0,
                      paddingInline: 0,
                      display: "flex",
                      justifyContent: "flex-start",
                      whiteSpace: "nowrap",
                      width: "100%",
                    }}
                    onClick={() => func()}
                  >
                    <Typography
                      size="small"
                      sx={{
                        color: wpTheme.mousetoolBox.color,
                        px: 1,
                        py: 0.25,
                        fontSize: wpTheme.mousetoolBox.fontSize,
                      }}
                    >
                      {menu}
                    </Typography>
                  </Box>
                </ListItem>
              ))}
            </List>
          </Box>
        </ClickAwayListener>
      )}
    </>
  );
};
