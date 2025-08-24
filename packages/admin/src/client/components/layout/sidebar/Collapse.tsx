"use client";

import { Box, Button, Tooltip } from "@mui/material";
import { useWPAdmin } from "../../../wp-admin";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const Collapse = (props: { open: boolean }) => {
  const { open } = props;
  const { wpRawTheme } = useWPTheme();
  const {
    sidebar,
    wp: { viewport },
  } = useWPAdmin();
  if (viewport.isMobile) {
    return null;
  }

  const handleClick = () => {
    if (sidebar.state.collapsed || !sidebar.state.sticked) {
      sidebar.setState({
        collapsed: false,
        width: sidebar.px.open,
        marginLeft: sidebar.px.open,
        sticked: true,
      });
    } else {
      sidebar.setState({
        collapsed: true,
        width: sidebar.px.collapsed,
        marginLeft: sidebar.px.collapsed,
        sticked: false,
      });
    }
  };

  return (
    <Box
      component="div"
      sx={{
        position: "absolute",
        zIndex: 1,
        left: sidebar.state.width,
        transition: "0.2s ease",
        opacity: open ? "100%" : "0%",
        width: 0,
        height: "100dvh",
      }}
    >
      <Tooltip
        title={sidebar.state.sticked ? "collapse ]" : "lock"}
        placement="top"
      >
        <Button
          size="small"
          sx={{
            position: "relative",
            top: "90dvh",
            left: -20,
            backgroundColor: wpRawTheme.global.colorScale[600],
            ":hover": {
              backgroundColor: wpRawTheme.global.colorScale[500],
            },
            minWidth: 30,
            display: open ? "auto" : "none",
          }}
          onClick={handleClick}
        >
          <Typography
            size="medium"
            sx={{
              color: wpRawTheme.global.colorScale[100],
            }}
          >
            {sidebar.state.sticked ? "←" : "↦"}
          </Typography>
        </Button>
      </Tooltip>
    </Box>
  );
};
