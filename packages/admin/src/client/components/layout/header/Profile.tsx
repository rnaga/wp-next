"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import DarkModeIcon from "@mui/icons-material/DarkMode";
import LightModeIcon from "@mui/icons-material/LightMode";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  ClickAwayListener,
  Divider,
  IconButton,
} from "@mui/material";
import { useComputed, useSignal } from "@preact/signals-react";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useSchemeToggle } from "@rnaga/wp-next-ui/hooks/use-scheme-toggle";
import { useWPAdmin } from "../../../wp-admin";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { PopperMenu } from "@rnaga/wp-next-ui/PopperMenu";

import { MenuItem as MuiMenuItem } from "@mui/material";
import { wpBlogMeta } from "@rnaga/wp-node/validators/database";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";

function MenuItem(props: {
  title: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  const { title, icon, onClick } = props;
  return (
    <MuiMenuItem
      sx={{ display: "grid", gridTemplateColumns: "40% 1fr" }}
      onClick={onClick}
    >
      {icon}
      <Typography>{title}</Typography>
    </MuiMenuItem>
  );
}

export const Profile = () => {
  const { site } = useWPAdmin();
  const { user: currentUser } = useUser();
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const { gotoPath, goto } = useAdminNavigation();
  const { wpRawTheme } = useWPTheme();

  const [open, setOpen] = useState(false);
  const { mode, updateMode } = useSchemeToggle();

  const dateTime = useSignal<string>("");
  const currentDateTime = useComputed(() => dateTime.value);

  useEffect(() => {
    const i = setInterval(() => {
      dateTime.value = new Intl.DateTimeFormat("en-US", {
        dateStyle: "short",
        timeStyle: "long",
        timeZone: site.settings.timezone,
      }).format(new Date());
    }, 1000);

    return () => clearInterval(i);
  }, []);

  return (
    <ClickAwayListener
      onClickAway={() => {
        open && setOpen(false);
      }}
    >
      <Box>
        <IconButton
          ref={buttonRef}
          sx={{
            border: 0,
            p: 0,
            "&:hover": {
              backgroundColor: "transparent",
              color: "inherit",
            },
          }}
          component="a"
          onClick={() => setOpen(!open)}
        >
          <Avatar
            sx={{
              color: wpRawTheme.global.colorScale[100],
              backgroundColor: wpRawTheme.global.colorScale[600],
              "&:hover": {
                backgroundColor: wpRawTheme.global.colorScale[500],
              },
            }}
          >
            {currentUser?.display_name[0].toUpperCase()}
          </Avatar>
        </IconButton>

        <PopperMenu
          anchorEl={buttonRef.current}
          sx={{ px: 1, minWidth: 200, maxWidth: 300 }}
          open={open}
          onClose={() => setOpen(false)}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              mx: 2,
              my: 1,
              minWidth: 150,
            }}
          >
            {" "}
            <Typography size="medium" fontWeight={600}>
              {currentUser?.display_name}
            </Typography>
            <Typography>{currentUser?.user_email}</Typography>
          </Box>
          <Divider />
          <Typography sx={{ mx: 2, my: 1 }}>{currentDateTime}</Typography>
          <Divider />
          <MenuItem
            title="Profile"
            icon={<PersonIcon />}
            onClick={() => gotoPath("/profile", { segment: "blog" })}
          />
          <MenuItem
            title={mode == "light" ? "Dark Mode" : "Light Mode"}
            icon={mode == "light" ? <DarkModeIcon /> : <LightModeIcon />}
            onClick={() => {
              updateMode(mode == "light" ? "dark" : "light");
            }}
          />
          <Divider />
          <MenuItem
            title="Logout"
            icon={<LogoutIcon />}
            onClick={() => goto("/api/auth/signout")}
          />
        </PopperMenu>
      </Box>
    </ClickAwayListener>
  );
};
