"use client";
import React, { useEffect, useState, useTransition } from "react";

import FileUploadIcon from "@mui/icons-material/FileUpload";
import SearchIcon from "@mui/icons-material/Search";
import TableViewIcon from "@mui/icons-material/TableView";
import ViewListIcon from "@mui/icons-material/ViewList";
import { Box, IconButton, Stack } from "@mui/material";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Pagination } from "@rnaga/wp-next-ui/list/Pagination";
import { Loading } from "@rnaga/wp-next-ui/Loading";

import { MediaUpload } from "@rnaga/wp-next-ui/media/MediaUpload";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useAdminServerActions } from "../../../../hooks/use-admin-server-actions";
import { useWPAdmin } from "../../../../wp-admin";
import { Table } from "./Table";
import { Thumbnail } from "./Thumbnail";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const List = () => {
  const {
    wp: { viewport, globalState },
  } = useWPAdmin();
  const { user } = useUser();
  const { actions, parse } = useAdminServerActions();
  const { updateRouter, queryObject, navigationStatus, refreshValue, refresh } =
    useAdminNavigation();
  const { overlay } = useWPAdmin();

  const [listType, setListType] = useState<"thumbnail" | "table">("thumbnail");
  const mediaTargetItemState = globalState.get("media-target-item");
  const mediaUploadState = globalState.get("media-upload");

  const [{ posts, info }, setPosts] = useState<{
    posts: wpCoreTypes.actions.Posts | undefined;
    info: wpCoreTypes.actions.PostsInfo | undefined;
  }>({
    posts: undefined,
    info: undefined,
  });
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const [posts, info] = await actions.post
        .list(
          { ...queryObject, status: ["inherit"], per_page: 20 },
          { postTypes: ["attachment"] }
        )
        .then(parse);
      setPosts({ posts, info });
    });
  }, [navigationStatus, refreshValue().content]);

  useEffect(() => {
    if (!mediaTargetItemState?.post || !posts) {
      return;
    }

    for (const [index, post] of Object.entries(posts)) {
      if (post.ID === mediaTargetItemState.post.ID) {
        posts[parseInt(index)] = {
          ...post,
          ...mediaTargetItemState.post,
        };
      }
    }
    setPosts({ posts, info });
  }, [mediaTargetItemState?.post]);

  return (
    <Stack spacing={2}>
      {user?.role.capabilities.has("upload_files") && (
        <Box>
          <Button
            startIcon={<FileUploadIcon />}
            onClick={() => {
              globalState.set("media-upload", {
                open: !mediaUploadState?.open,
              });
            }}
          >
            Upload Media File
          </Button>
        </Box>
      )}

      {globalState.get("media-upload")?.open && (
        <MediaUpload
          showCloseButton={true}
          onUploadComplete={() => {
            overlay.snackbar.open(
              "success",
              "New media has been successfully added"
            );
            refresh(["main"]);
          }}
        />
      )}

      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Box sx={{ flexGrow: 1 }}>
          <IconButton onClick={() => setListType("thumbnail")}>
            <ViewListIcon />
          </IconButton>
          <IconButton onClick={() => setListType("table")}>
            <TableViewIcon />
          </IconButton>
        </Box>
        <Input
          size="medium"
          placeholder="Search"
          startAdornment={
            <SearchIcon
              sx={{
                opacity: 0.5,
              }}
            />
          }
          sx={{ flexGrow: viewport.isMobile ? 1 : 0, mr: 1 }}
          onChange={(value) => updateRouter({ search: value, page: 1 })}
        />
        <Pagination pagination={info?.pagination} />
      </Box>

      <Loading loading={loading}>
        {listType == "thumbnail" ? (
          <Thumbnail posts={posts} />
        ) : (
          <Table posts={posts} />
        )}
      </Loading>
    </Stack>
  );
};
