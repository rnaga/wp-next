"use client";

import { useEffect } from "react";
import { z } from "zod";

import { Box, Divider } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { TinyMce } from "@rnaga/wp-next-rte/tinymce/TinyMce";
import { Tiptap } from "@rnaga/wp-next-rte/tiptap/Tiptap"; // Importing the Tiptap component
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";

import { PostPanel, PostPanelWrapper } from "../../../../components/utils/post";
import { useAdminNavigation } from "../../../../hooks/";
import { useWPAdmin } from "../../../../wp-admin";
import { Settings } from "./Settings";
import { Toolbar } from "./Toolbar";

import type * as types from "../../../../../types";

export const Edit = () => {
  const {
    overlay,
    wp: { error },
  } = useWPAdmin();
  const { actions, parse } = useServerActions();
  const { formData, setFormData, setFormReady, formReady } =
    useFormData<types.client.formdata.PostUpsert>("post");
  const { searchParams } = useAdminNavigation();

  const parsed = z
    .string()
    .transform((v) => parseInt(v))
    .safeParse(searchParams.get("id"));

  const postId = parsed.success ? parsed.data : undefined;

  useEffect(() => {
    if (!postId) {
      setFormReady(true);
      return;
    }
    overlay.circular.promise(actions.post.get(postId)).then((response) => {
      const [post] = parse(response);
      if (post?.post_status === "trash") {
        error.throw(
          "You cannot edit this item because it is in the Trash. Please restore it and try again."
        );
        return;
      }
      setFormData(post, { ready: true });
    });
  }, []);

  if (!formReady) return null;

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 2 }}
    >
      <PostPanelWrapper>
        <Toolbar />
        <Divider />
        <PostPanel>
          <Tiptap
            defaultContent={formData?.post_content}
            onUpdate={(editor, transaction) => {
              setFormData({ post_content: editor.getHTML() });
            }}
          />

          {/* <TinyMce
            editorKey={formData?.ID ?? 0}
            initialValue={formData?.post_content}
            onChange={(content) => {
              setFormData({ post_content: content });
            }}
          /> */}
          <Settings />
        </PostPanel>
      </PostPanelWrapper>
    </Box>
  );
};
