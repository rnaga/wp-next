"use client";
import { ReactNode } from "react";

import { Box, Stack } from "@mui/material";
import { InputSearch } from "@rnaga/wp-next-ui/InputSearch";
import { Pagination } from "@rnaga/wp-next-ui/list/Pagination";

import { SelectWPAvailableSite } from "../../../../components/utils/dropdown/SelectWPAvailableSite";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Toolbar = (props: {
  list:
    | {
        users: wpCoreTypes.actions.UsersEdit;
        info: wpCoreTypes.actions.UsersEditInfo;
      }
    | undefined;
  children?: ReactNode;
}) => {
  const { list, children } = props;
  const {
    wp: { viewport },
  } = useWPAdmin();

  const { pushRouter } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"user">>();

  const handleSitesDropdown = (siteId?: number, blogId?: number) => {
    blogId
      ? pushRouter({
          blog_id: blogId,
        })
      : siteId &&
        pushRouter({
          site_id: siteId,
        });
  };

  return (
    <>
      {children}
      <Stack
        spacing={1}
        sx={{
          display: "grid",
          gridTemplateColumns: viewport.isMobile ? "100%" : "1.5fr 1fr",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-start",
            gap: 1,
            flexGrow: 1,
          }}
        >
          <SelectWPAvailableSite
            onClick={handleSitesDropdown}
            capabilities={["list_users"]}
          />
          <InputSearch size="medium" sx={{ flexGrow: 1, minWidth: 250 }} />
        </Box>
        <Pagination pagination={list?.info?.pagination} />
      </Stack>
    </>
  );
};
