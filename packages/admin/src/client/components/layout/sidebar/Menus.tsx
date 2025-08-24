"use client";

import React, { useEffect, useState } from "react";

import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import {
  Collapse,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../wp-admin";

import type * as types from "../../../../types";

const hasCapability = (
  capabilities: string[],
  user: ReturnType<typeof useUser>["user"] | undefined
) => {
  if (!user) return false;
  return (
    capabilities.filter((cap) => user.role.capabilities.has(cap)).length > 0
  );
};

const ListMenus = (props: { menu: types.client.AdminMenu; index: number }) => {
  const { menu, index } = props;
  const { currentPath, goto, blogBasePath } = useAdminNavigation();
  const { sidebar } = useWPAdmin();
  const { wpRawTheme } = useWPTheme();
  const getPath = (path?: string | string[]) =>
    Array.isArray(path) ? path[0] : path ?? "/";

  const matchPath = (currentPath: string, path?: string | string[]) =>
    path && Array.isArray(path)
      ? path.includes(currentPath)
      : path === currentPath;

  return (
    <ListItemButton
      key={index}
      selected={matchPath(currentPath, menu.path)}
      role="menuitem"
      component="a"
      href={menu.onClick ? undefined : `${blogBasePath}${getPath(menu.path)}`}
      onClick={(e) => {
        e.preventDefault();
        menu.onClick
          ? menu.onClick()
          : goto(`${blogBasePath}${getPath(menu.path)}`);
      }}
      sx={{
        color: wpRawTheme.global.colorScale[100],
      }}
    >
      <ListItemIcon
        sx={{
          color: wpRawTheme.global.colorScale[100],
          ...(sidebar.state.collapsed && {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }),
        }}
      >
        {menu.icon}
      </ListItemIcon>
      {!sidebar.state.collapsed && (
        <ListItemText>
          <Typography size="medium" bold>
            {menu.label}
          </Typography>
        </ListItemText>
      )}
    </ListItemButton>
  );
};

const NestedListMenus = (props: {
  menu: types.client.AdminMenu;
  index: number;
}) => {
  const { menu, index } = props;
  const { wpRawTheme } = useWPTheme();

  const matchPath = (currentPath: string, path?: string | string[]) =>
    path && Array.isArray(path)
      ? path.includes(currentPath)
      : currentPath.startsWith(path ?? "");

  const navigation = useAdminNavigation();
  const [open, setOpen] = useState(
    matchPath(navigation.currentPath, menu.path)
  );
  const { user } = useUser();

  useEffect(() => {
    setOpen(matchPath(navigation.currentPath, menu.path));
  }, [navigation.blogBasePath]);

  return (
    <React.Fragment key={index}>
      <ListItemButton
        onClick={() => setOpen(!open)}
        sx={{
          color: wpRawTheme.global.colorScale[100],
        }}
      >
        <ListItemIcon
          sx={{
            color: wpRawTheme.global.colorScale[100],
          }}
        >
          {menu.icon}
        </ListItemIcon>
        <ListItemText>
          <Typography size="medium" bold>
            {menu.label}
          </Typography>
        </ListItemText>
        <KeyboardArrowRightIcon
          sx={{ transform: open ? "rotate(90deg)" : "none" }}
        />
      </ListItemButton>

      <Collapse in={open} timeout="auto" unmountOnExit>
        {menu.nestedMenus
          ?.filter((nestedNenu) => nestedNenu.displayOnSidebar)
          .filter((nestedMenu) =>
            nestedMenu.capabilitiesInherit
              ? hasCapability(menu.capabilities ?? [], user)
              : hasCapability(nestedMenu.capabilities ?? [], user)
          )
          .map((menu, index) => (
            <ListMenus key={index} menu={menu} index={index} />
          ))}
      </Collapse>
    </React.Fragment>
  );
};

export const Menus = (props: { menus: types.client.AdminMenu[] }) => {
  const { menus } = props;

  const { sidebar } = useWPAdmin();
  const { user } = useUser();

  return menus
    .filter((menu) => menu.displayOnSidebar)
    .filter((menu) => {
      return hasCapability(menu.capabilities ?? [], user);
    })
    .map((menu, index) => {
      return menu.nestedMenus && !sidebar.state.collapsed ? (
        <NestedListMenus key={index} menu={menu} index={index} />
      ) : (
        <ListMenus key={index} menu={menu} index={index} />
      );
    });
};
