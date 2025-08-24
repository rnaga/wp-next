"use client";
/* eslint-disable jsx-a11y/anchor-is-valid */
import { useCallback, useEffect, useState, useTransition } from "react";

import CommentIcon from "@mui/icons-material/Comment";
import { AccordionDetails, Box, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { Accordion } from "@rnaga/wp-next-ui/Accordion";
import { Chip } from "@rnaga/wp-next-ui/Chip";
import {
  ActionTd,
  ListGrid,
  ListGridItem,
  ListGridTitle,
  SortableTh,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { formatting } from "@rnaga/wp-node/common/formatting";

import { AdminLink } from "../../../../components/utils/link";
import { PostRowLinks } from "../../../../components/utils/post/link";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";
import { ActionLink } from "./ActionLink";
import { Statuses } from "./Statuses";
import { Toolbar } from "./Toolbar";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const List = () => {
  const {
    wp: { viewport },
  } = useWPAdmin();
  const { userCan } = useUser();
  const { actions, parse } = useServerActions();
  const [loading, startTransition] = useTransition();
  const { navigationStatus, queryObject, refreshValue } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"post">>();

  const [{ posts, info }, setPosts] = useState<{
    posts: wpCoreTypes.actions.Posts | undefined;
    info: wpCoreTypes.actions.PostsInfo | undefined;
  }>({
    posts: undefined,
    info: undefined,
  });

  const fetchPosts = useCallback(async () => {
    const [posts, info] = await actions.post
      .list(queryObject, { postTypes: ["page"] })
      .then(parse);
    setPosts({ posts, info });
  }, [navigationStatus, refreshValue().content]);

  useEffect(() => {
    startTransition(fetchPosts);
  }, [navigationStatus]);

  useEffect(() => {
    fetchPosts();
  }, [refreshValue().content]);

  return (
    <Stack spacing={2}>
      <Toolbar posts={posts} info={info}>
        <Statuses />
      </Toolbar>
      <Loading loading={loading}>
        <Table>
          <THead>
            <SortableTh name="Title" orderby="post_name" />
            <Th viewport="desktop">Author</Th>
            <Th viewport="desktop" style={{ width: "40px" }}>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CommentIcon fontSize="small" />
              </Box>
            </Th>
            <SortableTh
              show={viewport.isDesktop}
              name="Date"
              orderby="post_date"
            />
          </THead>
          <tbody>
            {posts?.map((post) => (
              <Tr key={`${post.ID}`}>
                <ActionTd viewport="desktop">
                  <AdminLink
                    subPage="/edit"
                    queryParams={{ id: post.ID }}
                    disabled={!userCan("edit_post", post)}
                  >
                    {post.post_title}
                  </AdminLink>
                  <ActionLink post={post} />
                </ActionTd>
                <Td viewport="mobile">
                  <Accordion>
                    <ListGridTitle title={post.post_title} />
                    <AccordionDetails>
                      <ActionLink post={post} />
                      <ListGrid>
                        <ListGridItem title="Author">
                          <PostRowLinks row={post} field="actor" />
                        </ListGridItem>
                        <ListGridItem title="Date">
                          <Typography>
                            {formatting.date(post.post_date)}
                          </Typography>
                        </ListGridItem>
                      </ListGrid>
                    </AccordionDetails>
                  </Accordion>
                </Td>
                <Td viewport="desktop">
                  <PostRowLinks row={post} field="actor" />
                </Td>
                <Td viewport="desktop">
                  <Chip label={post.comment_count} />
                </Td>
                <Td viewport="desktop">{formatting.date(post.post_date)}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Loading>
    </Stack>
  );
};
