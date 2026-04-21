"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import {
  Avatar,
  Box,
  ClickAwayListener,
  Divider,
  IconButton,
  MenuItem as MuiMenuItem,
} from "@mui/material";
import { useComputed, useSignal } from "@preact/signals-react";
import { useAdminNavigation } from "@rnaga/wp-next-admin/client/hooks/use-admin-navigation";
import { useWPAdmin } from "@rnaga/wp-next-admin/client/wp-admin";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { PopperMenu } from "@rnaga/wp-next-ui/PopperMenu";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

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

export const HeaderProfile = () => {
  const { site } = useWPAdmin();
  const { user: currentUser } = useUser();
  const buttonRef = useRef<HTMLAnchorElement>(null);
  const { goto } = useAdminNavigation();
  const { wpRawTheme } = useWPTheme();
  const {
    site: { blogBasePath },
  } = useWPAdmin();

  const [open, setOpen] = useState(false);

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
            p: "3px",
            borderRadius: "6px",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          }}
          component="a"
          onClick={() => setOpen(!open)}
        >
          <Avatar
            sx={{
              width: 26,
              height: 26,
              fontSize: "13px",
              fontWeight: 600,
              color: wpRawTheme.global.colorScale[100],
              backgroundColor: wpRawTheme.global.colorScale[600],
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
            onClick={() => {
              location.href = `${blogBasePath}/blog/profile`;
            }}
          />
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
