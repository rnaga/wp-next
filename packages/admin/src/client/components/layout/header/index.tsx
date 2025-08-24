"use client";

import React, { useMemo, useRef, useState } from "react";

import BookIcon from "@mui/icons-material/Book";
import HomeIcon from "@mui/icons-material/Home";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import MiscellaneousServicesIcon from "@mui/icons-material/MiscellaneousServices";
import PersonIcon from "@mui/icons-material/Person";
import ViewSidebarIcon from "@mui/icons-material/ViewSidebar";
import WebIcon from "@mui/icons-material/Web";
import { Box, IconButton, MenuItem, MenuList } from "@mui/material";
import { PopperMenu } from "@rnaga/wp-next-ui/PopperMenu";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Viewport } from "@rnaga/wp-next-ui/Viewport";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useAdminUser } from "../../../hooks/use-admin-user";
import { useWPAdmin } from "../../../wp-admin";
import { Profile } from "./Profile";

const HomeMenuItems = () => {
  const menuItems: React.ReactNode[] = [];
  const { site: currentSite, sidebar } = useWPAdmin();
  const { adminUser } = useAdminUser();
  const { wpTheme } = useWPTheme();

  for (const site of adminUser?.availableSites.sites ?? []) {
    menuItems.push(
      <MenuItem
        key={`${site.site_id}-0`}
        sx={{
          "&:hover": {
            backgroundColor: "transparent",
          },
          cursor: "default",
        }}
      >
        <Typography
          size="medium"
          sx={{
            maxWidth: sidebar.px.open,
            textOverflow: "ellipsis",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
          bold
        >
          <HomeIcon fontSize="small" />
          {site.sitename}
        </Typography>
      </MenuItem>
    );

    menuItems.push(
      <MenuItem
        key={`${site.site_id}-1`}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          ml: 1,
          "&:hover": {
            backgroundColor: "transparent",
          },
        }}
      >
        {site.blogs?.map((blog) => (
          <Box
            key={`${blog.blog_id}`}
            sx={{
              textDecoration: "none",
              color: wpTheme.colorScale[800],
              "&:hover": {
                backgroundColor: wpTheme.colorScale[300],
              },
              p: 0.5,
            }}
            component="a"
            href={`${currentSite.basePath}/${blog.blog_id}`}
          >
            <Typography
              sx={{
                maxWidth: sidebar.px.open,
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {blog.blogname}
            </Typography>
          </Box>
        ))}
      </MenuItem>
    );
  }
  return menuItems;
};

const ManageSiteMenuItems = () => {
  const { user } = useAdminUser();
  const { site: currentSite, sidebar } = useWPAdmin();

  const { gotoPath } = useAdminNavigation();
  const menuItems: React.ReactNode[] = [];

  // For users
  if (user?.role.capabilities.has("list_users")) {
    menuItems.push(
      <MenuItem key="manage-users">
        <Typography
          size="medium"
          bold
          onClick={() =>
            gotoPath("/users", {
              segment: currentSite.isMultiSite ? "site" : "blog",
            })
          }
          component="div"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <PersonIcon />
          Users
        </Typography>
      </MenuItem>
    );
  }

  // For blog and sites
  if (user?.role.capabilities.has("manage_network")) {
    menuItems.push(
      <MenuItem key="manage-sites">
        <Typography
          size="medium"
          bold
          onClick={() =>
            gotoPath("/sites", {
              segment: currentSite.isMultiSite ? "site" : "blog",
            })
          }
          component="div"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <WebIcon />
          Sites
        </Typography>
      </MenuItem>
    );

    menuItems.push(
      <MenuItem key="manage-blogs">
        <Typography
          size="medium"
          bold
          onClick={() =>
            gotoPath("/blogs", {
              segment: currentSite.isMultiSite ? "site" : "blog",
            })
          }
          component="div"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <BookIcon />
          Blogs
        </Typography>
      </MenuItem>
    );
  }

  return menuItems;
};

export const Header = () => {
  const {
    wp: { viewport },
    site: currentSite,
    sidebar,
  } = useWPAdmin();
  const { user } = useAdminUser();
  const { wpRawTheme } = useWPTheme();

  const homeButtonRef = useRef<HTMLAnchorElement>(null);
  const [openHomeMenu, setOpenHomeMenu] = useState(false);

  const manageSiteButtonRef = useRef<HTMLAnchorElement>(null);
  const [openManageSiteMenu, setOpenManageSiteMenu] = useState(false);

  const profileKey = useMemo(() => {
    return `profile-${currentSite.settings.timezone}-${user?.ID}`;
  }, [currentSite.settings.timezone, user]);

  return (
    <Box
      //variant="solid"
      sx={{
        py: 0.5,
        px: 2,
        display: "flex",
        alignItems: "center",
        bgcolor: wpRawTheme.global.colorScale[800],
      }}
    >
      <Viewport device="desktop">
        <Box sx={{ display: "flex", minWidth: sidebar.px.open }}>
          <Typography
            size="xlarge"
            sx={{
              maxWidth: sidebar.px.open,
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              overflow: "hidden",
              color: wpRawTheme.global.colorScale[100],
            }}
            bold
          >
            {currentSite.name}
          </Typography>
        </Box>
      </Viewport>

      <Viewport device="mobile">
        <IconButton
          onClick={() => {
            sidebar.toggle(sidebar.state.collapsed);
          }}
          sx={{
            color: wpRawTheme.global.colorScale[100],
            borderRadius: 1,
            "&:hover": {
              color: wpRawTheme.global.colorScale[800],
              backgroundColor: wpRawTheme.global.colorScale[300],
              borderRadius: 1,
            },
          }}
        >
          <ViewSidebarIcon />
        </IconButton>
      </Viewport>

      <Box
        sx={{
          display: "flex",
          gap: viewport.isDesktop ? 1 : 0,
          flexGrow: 1,
          alignItems: "center",
        }}
      >
        {currentSite.isMultiSite && (
          <Box>
            <IconButton
              ref={homeButtonRef}
              component="a"
              sx={{
                border: 0,
                gap: 1,
                color: wpRawTheme.global.colorScale[100],
                borderRadius: 1,
                "&:hover": {
                  color: wpRawTheme.global.colorScale[800],
                  backgroundColor: wpRawTheme.global.colorScale[300],
                  borderRadius: 1,
                },
              }}
              onClick={() => setOpenHomeMenu(!openHomeMenu)}
            >
              <HomeWorkIcon />
              <Viewport device="desktop">
                <Typography
                  bold
                  sx={{
                    color: wpRawTheme.global.colorScale[100],
                  }}
                >
                  My Sites
                </Typography>
              </Viewport>
            </IconButton>

            <PopperMenu
              anchorEl={homeButtonRef.current}
              open={openHomeMenu}
              onClose={() => setOpenHomeMenu(false)}
              sx={{
                maxHeight: "50dvh",
                overflowY: "auto",
                minWidth: 150,
                minHeight: 400,
              }}
            >
              <MenuList>
                <HomeMenuItems />
              </MenuList>
            </PopperMenu>
          </Box>
        )}

        {((currentSite.isMultiSite &&
          user?.role.capabilities.has("list_users")) ||
          user?.role.capabilities.has("manage_network")) && (
          <Box>
            <IconButton
              ref={manageSiteButtonRef}
              component="a"
              sx={{
                border: 0,
                gap: 1,
                color: wpRawTheme.global.colorScale[100],
                borderRadius: 1,
                "&:hover": {
                  color: wpRawTheme.global.colorScale[800],
                  backgroundColor: wpRawTheme.global.colorScale[300],
                  borderRadius: 1,
                },
              }}
              onClick={() => setOpenManageSiteMenu(!openManageSiteMenu)}
            >
              <MiscellaneousServicesIcon />
              <Viewport device="desktop">
                <Typography
                  bold
                  sx={{
                    color: wpRawTheme.global.colorScale[100],
                  }}
                >
                  Manage Network
                </Typography>
              </Viewport>
            </IconButton>

            <PopperMenu
              anchorEl={manageSiteButtonRef.current}
              open={openManageSiteMenu}
              onClose={() => setOpenManageSiteMenu(false)}
              sx={{
                maxHeight: "50dvh",
                overflowY: "auto",
              }}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
            >
              <MenuList>
                <ManageSiteMenuItems />
              </MenuList>
            </PopperMenu>
          </Box>
        )}
      </Box>

      <Profile key={profileKey} />
    </Box>
  );
};
