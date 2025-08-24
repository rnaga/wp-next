"use client";

import { AccordionDetails } from "@mui/material";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { Accordion, AccordionSummary } from "@rnaga/wp-next-ui/Accordion";
import { CardImage } from "@rnaga/wp-next-ui/CardImage";
import { Viewport } from "@rnaga/wp-next-ui/Viewport";
import { formatting } from "@rnaga/wp-node/common/formatting";

import { AdminLink } from "../../../../components/utils/link";
import {
  ActionTd,
  ListGrid,
  ListGridItem,
  SortableTh,
  Table as TableList,
  Td,
  Th,
  THead,
  Tr,
} from "@rnaga/wp-next-ui/list";
import { PostRowLinks } from "../../../../components/utils/post";
import { useWPAdmin } from "../../../../wp-admin";
import { ActionLink } from "./ActionLink";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
export const Table = (props: {
  posts: wpCoreTypes.actions.Posts | undefined;
}) => {
  const { posts } = props;
  const {
    wp: { viewport, globalState },
  } = useWPAdmin();
  const { user } = useUser();

  const handleClick = (post: wpCoreTypes.actions.Posts[number]) => () => {
    globalState.set({
      "media-edit-modal": {
        open: true,
      },
      "media-target-item": {
        post,
      },
    });
  };

  const canEdit = (post: wpCoreTypes.actions.Posts[number]) =>
    user?.ID == post.author.ID ||
    user?.role.capabilities.has("edit_others_posts");

  if (!posts) {
    return null;
  }

  return (
    <TableList>
      <THead>
        <Th style={{ width: "25%" }}>File</Th>
        <SortableTh
          style={{ width: viewport.isDesktop ? "35%" : "75%" }}
          name="Title"
          orderby="post_name"
        />
        <Th viewport="desktop">Author</Th>
        <Th viewport="desktop"> </Th>
        <SortableTh viewport="desktop" name="Date" orderby="post_date" />
      </THead>
      <tbody>
        {posts.map((post) => (
          <Tr key={post.ID}>
            <Td>
              <CardImage
                src={post.guid}
                alt={post.post_title}
                sx={{
                  minWidth: 150,
                  maxWidth: 200,
                  cursor: canEdit(post) ? "pointer" : "inherit",
                }}
                onClick={canEdit(post) ? handleClick(post) : undefined}
              />
            </Td>
            <ActionTd>
              <Viewport device="desktop">{post.post_title}</Viewport>
              <Viewport device="desktop">
                <ActionLink post={post} />
              </Viewport>
            </ActionTd>

            <Td viewport="mobile">
              <Accordion disableGutters elevation={0} square expanded>
                <AccordionSummary>
                  {" "}
                  <AdminLink
                    subPage="/edit"
                    queryParams={{ id: post.ID }}
                    disabled={!canEdit(post)}
                  >
                    {post.post_title}
                  </AdminLink>
                </AccordionSummary>
                <AccordionDetails>
                  <ActionLink post={post} />
                  <ListGrid>
                    <ListGridItem title="Author">
                      <PostRowLinks row={post} field="actor" />
                    </ListGridItem>
                    <ListGridItem title="Date">
                      {formatting.date(post.post_date)}
                    </ListGridItem>
                  </ListGrid>
                </AccordionDetails>
              </Accordion>
            </Td>
            <Td viewport="desktop">
              <PostRowLinks row={post} field="actor" />
            </Td>
            <Td viewport="desktop">{post.comment_count}</Td>
            <Td viewport="desktop">{formatting.date(post.post_date)}</Td>
          </Tr>
        ))}
      </tbody>
    </TableList>
  );
};
