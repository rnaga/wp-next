"use client";
import { useCallback, useEffect, useState, useTransition } from "react";

import {
  Box,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  Stack,
} from "@mui/material";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { LightEditor } from "@rnaga/wp-next-rte/tiptap/LightEditor";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Card } from "@rnaga/wp-next-ui/Card";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Table, Td, Tr } from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { formatting } from "@rnaga/wp-node/common/formatting";

import { Comments } from "../../../components/contents/comments";
import { AdminLink } from "../../../components/utils/link";
import { useAdminNavigation } from "../../../hooks";
import { useAdminServerActions } from "../../../hooks/use-admin-server-actions";
import { useWPAdmin } from "../../../wp-admin";

import type * as types from "../../../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

function PostEditLink(props: { post: wpCoreTypes.actions.Posts[number] }) {
  const { post } = props;
  const { userCan } = useUser();

  return (
    <AdminLink
      segment="blog"
      page="posts"
      subPage="/edit"
      queryParams={{ id: post.ID }}
      disabled={!userCan("edit_post", post)}
    >
      {post.post_title || "(No Title)"}
    </AdminLink>
  );
}

export const Dashboard = () => {
  const { overlay } = useWPAdmin();
  const { user, userCan } = useUser();
  const { refresh, refreshValue } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"comment">>();
  const { actions, parse, safeParse } = useAdminServerActions();
  const { formData, setFormData, submit } =
    useFormData<types.client.formdata.PostUpsert>("post");

  const [dashboard, setDasboard] = useState<types.actions.DashBoard>();
  const [loading, startTransition] = useTransition();

  const fetchActivity = useCallback(async () => {
    const [counts] = await actions.dashboard.counts().then(parse);
    const [activity, activityInfo] = await actions.dashboard
      .activity()
      .then(parse);

    const [postDrafts] =
      (await actions.post
        .list({ status: ["draft"], per_page: 5, author: [user?.ID ?? 0] })
        .then(parse)) ?? [];

    setDasboard({
      counts,
      activity,
      activityInfo,
      postDrafts,
    });
  }, [refreshValue().content]);

  useEffect(() => {
    startTransition(fetchActivity);
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [refreshValue().content]);

  const handleSubmit = async (data: typeof formData) => {
    console.log(formData);

    formData.post_author = user?.ID;
    formData.post_title = data.post_title;
    formData.post_content = data.post_content;

    // Covert Date object to string
    formData.post_date = formatting.dateMySQL(formData.post_date, {
      withGMTOffset: true,
    });

    formData.post_date_gmt = formatting.dateMySQL(formData.post_date);

    const result = await overlay.circular
      .promise(
        actions.post.create({
          ...formData,
          post_type: "post",
          post_status: "draft",
        })
      )
      .then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    overlay.snackbar.open("success", "Post has been saved");
    refresh(["content"]);
  };

  return (
    <Loading loading={loading}>
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid size={{ xs: 12, md: userCan("edit_posts") ? 6 : 12 }}>
          <Stack spacing={2}>
            <Card
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 2,
              }}
              variant="outlined"
            >
              <Typography size="large" bold>
                At a Glance
              </Typography>
              <Divider />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                }}
              >
                <AdminLink
                  segment="blog"
                  page="posts"
                  disabled={!userCan("edit_posts")}
                >
                  <Typography size="medium" sx={{ px: 1.5 }}>
                    {dashboard?.counts.posts} Posts
                  </Typography>
                </AdminLink>

                <AdminLink
                  segment="blog"
                  page="pages"
                  disabled={!userCan("edit_pages")}
                >
                  <Typography size="medium" sx={{ px: 1.5 }}>
                    {dashboard?.counts.pages} Pages
                  </Typography>
                </AdminLink>

                <AdminLink
                  segment="blog"
                  page="comments"
                  disabled={!userCan("edit_posts")}
                >
                  <Typography size="medium" sx={{ px: 1.5 }}>
                    {dashboard?.counts.comments} comments
                  </Typography>
                </AdminLink>
              </Box>
            </Card>
            <Card
              sx={{
                p: 2,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 2,
              }}
              variant="outlined"
            >
              <Typography size="large" bold>
                Activity
              </Typography>
              <Divider />
              <Typography size="medium">Recently Published</Typography>
              <Table>
                <tbody>
                  {dashboard?.activity.posts.map((post) => (
                    <Tr key={`posts-${post.ID}`}>
                      <Td>
                        {formatting.date(post.post_date, {
                          format: "MMM Do YY, h:mm a",
                        })}
                      </Td>
                      <Td>
                        <PostEditLink post={post} />
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
              <Divider />
              <Typography size="medium" bold>
                Recent Comments
              </Typography>
              <Table
                stripe="even"
                ariaLabel="table variants"
                sx={{ borderCollapse: "inherit" }}
              >
                <tbody>
                  {dashboard?.activity.comments.map((comment) => (
                    <Tr key={`comments-${comment.comment_ID}`}>
                      <Td>
                        <Stack spacing={0.5}>
                          <Typography>
                            From <b>{comment.comment_author}</b> on{" "}
                            <b>{comment.post_title}</b>
                          </Typography>
                          <Typography
                            sx={{
                              p: 1,
                            }}
                          >
                            {comment.comment_content}
                          </Typography>
                          {userCan("edit_comment", comment) && (
                            <Comments.ActionLink comment={comment} />
                          )}
                        </Stack>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Stack>
        </Grid>
        {userCan("edit_posts") && (
          <Grid size={{ xs: 12, md: 6 }}>
            <Card variant="outlined">
              <Typography size="large" bold>
                Quick Drafts
              </Typography>
              <Divider />
              <form onSubmit={submit(handleSubmit)}>
                <Stack
                  spacing={1}
                  sx={{ display: "grid", gridTemplateColumns: "1fr" }}
                >
                  <FormControl>
                    <FormLabel>
                      <Typography size="medium">Title</Typography>
                    </FormLabel>
                    <Input size="medium" name="post_title" />
                  </FormControl>
                  <FormControl>
                    <FormLabel>
                      <Typography size="medium">Content</Typography>
                    </FormLabel>
                    <LightEditor
                      //editorKey="post-draft"
                      //initialValue=""
                      // minHeight={200}
                      // onChange={(content) => {
                      //   console.log(content);
                      //   setFormData({ post_content: content });
                      // }}
                      minHeight={200}
                      onUpdate={(editor, transaction) => {
                        setFormData({ post_content: editor.getHTML() });
                      }}
                    />
                  </FormControl>
                  <Button type="submit">Save Draft</Button>
                </Stack>
              </form>
              <Divider />
              <Typography size="medium">Your Recent Drafts</Typography>
              <Table>
                <tbody>
                  {dashboard?.postDrafts.map((post) => (
                    <Tr key={`drafts-${post.ID}`}>
                      <Td>
                        <Typography display="block">
                          <PostEditLink post={post} />{" "}
                          {formatting.date(post.post_date, {
                            format: "MMM Do YY",
                          })}
                        </Typography>
                        <Box
                          sx={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            ml: 0.5,
                          }}
                        >
                          <Typography noWrap>{post.post_content}</Typography>
                        </Box>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </Grid>
        )}
      </Grid>
    </Loading>
  );
};
