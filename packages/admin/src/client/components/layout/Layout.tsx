"use client";

import { useEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { Box } from "@mui/material";

import { useAdminNavigation } from "../../hooks/use-admin-navigation";
import { useSidebar } from "../../hooks/use-sidebar";
import { useWPAdmin } from "../../wp-admin";
import { ErrorFallback } from "../utils/ErrorFallback";
import { Header } from "./header";
import { Main } from "./Main";
import { Overlay } from "./Overlay";
import { Sidebar } from "./sidebar";
import { Title } from "./Title";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";

export const Layout = () => {
  const wpAdmin = useWPAdmin();
  const adminNavigation = useAdminNavigation();
  const { wpTheme } = useWPTheme();

  const {
    wp: { globalState, wpHooks, viewport },
    sidebar,
    site,
  } = wpAdmin;
  const { pathname, blogBasePath, currentPath } = adminNavigation;
  const layoutKeys = globalState.get("layout-keys");

  const { setMenus } = useSidebar({ globalState, viewport });

  // Monitor pathname
  const currentSegment = globalState.get("page-segment");
  useEffect(() => {
    const segment = pathname.replace(blogBasePath, "").split("/")[1];
    if (segment !== currentSegment) {
      // Segment has changed. Update state to refresh sidebar and main content
      globalState.set("page-segment", segment ?? ("default" as any));
    }
  }, [pathname]);

  useEffect(() => {
    const menus = wpHooks.filter.apply("next_admin_menu", [], currentSegment, {
      wpAdmin,
      navigation: adminNavigation,
    });

    // menu items are empty. Close the sidebar
    if (menus.length == 0) {
      // Throw error as pagesetment is not found
      throw new Error(
        `Page segment is invalid. No menu items found. - ${currentSegment}`
      );
    }

    setMenus(menus);
  }, [currentSegment]);

  const currentPage = globalState.get("page");
  useEffect(() => {
    const page = currentPath.split("/")[2];
    if (page !== currentPage) {
      globalState.set("page", page);
    }
  }, [pathname]);

  return (
    <>
      <Overlay />
      <Box
        key={layoutKeys.header}
        component="header"
        sx={{
          position: "fixed",
          zIndex: 2,
          display: "block",
          width: "100%",
          height: 50,
        }}
      >
        <Header />
      </Box>
      <Box key={layoutKeys.sidebar}>
        <Sidebar />
      </Box>
      <Box
        key={layoutKeys.main}
        className="MainContainer"
        sx={{
          display: "flex",
          ml: `${sidebar.state.marginLeft}px`,
          pt: 5,
          height: "100vh",
        }}
      >
        <Box
          sx={{
            p: 3,
            zIndex: 0,
            width: "100%",
          }}
        >
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Title />
            <Main />
          </ErrorBoundary>
        </Box>
      </Box>
    </>
  );
};

export default Layout;
