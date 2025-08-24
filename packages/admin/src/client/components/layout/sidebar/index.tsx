"use client";

import { useEffect, useState } from "react";

import { List, Box } from "@mui/material";

import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";

import { useSidebar } from "../../../hooks/use-sidebar";
import { useWPAdmin } from "../../../wp-admin";
import { Collapse } from "./Collapse";
import { Menus } from "./Menus";

export const Sidebar = () => {
  const wpAdmin = useWPAdmin();
  const { wpRawTheme } = useWPTheme();
  const {
    wp: { viewport, globalState },
    overlay,
    sidebar,
  } = wpAdmin;

  const { menus } = useSidebar({ globalState, viewport });

  const [mouseHover, setMouseHover] = useState(false);

  // When collapse state changes
  useEffect(() => {
    if (viewport.isDesktop || sidebar.state.collapsed) {
      overlay.backdrop.close();
    }
    if (viewport.isMobile && !sidebar.state.collapsed) {
      overlay.backdrop.open({
        onClick: () => {
          sidebar.close();
        },
      });
    }
  }, [sidebar.state.collapsed]);

  // When viewport changes
  useEffect(() => {
    if (viewport.isMobile) {
      sidebar.close();
      return;
    }

    if (sidebar.state.collapsed) {
      sidebar.open();
    }

    overlay.backdrop.close();
  }, [viewport.isMobile]);

  useEffect(() => {
    if (true == sidebar.state.collapsed) {
      sidebar.close();
      return;
    }
    viewport.isMobile && sidebar.close();
  }, []);

  if (sidebar.state.collapsed && viewport.isMobile) {
    return null;
  }

  const handleMouseHover =
    (enter: boolean, currentSidebar: typeof sidebar) => () => {
      setMouseHover(enter);
      const sidebar = currentSidebar;

      if (viewport.isMobile || sidebar.state.sticked) {
        return;
      }

      sidebar.setState({
        ...sidebar.state,
        collapsed: enter ? false : true,
        width: enter ? sidebar.px.open : sidebar.px.collapsed,
      });
    };

  if (!menus || menus?.length === 0) {
    return null;
  }

  return (
    <Box
      component="div"
      className="Sidebar"
      sx={{
        position: "fixed",
        zIndex: 1,
        width: sidebar.state.width,
        transition: "0.2s ease",
        height: "100dvh",
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: wpRawTheme.global.colorScale[800],
        borderRight: `1.5px solid ${wpRawTheme.global.colorScale[700]}`,
      }}
      onMouseEnter={handleMouseHover(true, sidebar)}
      onMouseLeave={handleMouseHover(false, sidebar)}
    >
      <Box
        sx={{
          mt: 8,
          overflow: "hidden auto",
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: sidebar.state.collapsed ? "center" : "inherit",
        }}
      >
        <List
          sx={{
            boxSizing: "border-box",
          }}
        >
          <Menus menus={menus} />
        </List>
      </Box>

      <Collapse open={mouseHover} />
    </Box>
  );
};
