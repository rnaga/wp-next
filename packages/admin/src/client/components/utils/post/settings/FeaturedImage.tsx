"use client";
import { useEffect, useState } from "react";

import { Box, FormControl } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { CardImage } from "@rnaga/wp-next-ui/CardImage";
import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { useMediaSelector } from "@rnaga/wp-next-ui/hooks/use-media-selector";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { AdminLink } from "../../../../components/utils/link";
import { useWPAdmin } from "../../../../wp-admin";

import type * as types from "../../../../../types";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const FeaturedImage = () => {
  const { overlay } = useWPAdmin();
  const mediaSelector = useMediaSelector();
  const { actions, parse } = useServerActions();
  const { formData, setFormData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");

  const [featuredImage, setFeaturedImage] =
    useState<wpCoreTypes.actions.Posts[number]>();

  useEffect(() => {
    const postId = formData?.meta_input?._thumbnail_id;
    if (typeof postId !== "number") return;

    (async () => {
      const [posts] = await actions.post
        .list({ include: [postId] }, { postTypes: ["attachment"] })
        .then(parse);
      setFeaturedImage(posts[0]);
    })();
  }, [formData?.meta_input?._thumbnail_id]);

  const handleRemove = () => {
    delete formData?.meta_input?._thumbnail_id;

    const postId = formData?.ID;
    if (!postId) return;

    overlay.circular.promise(
      actions.meta
        .del("post", postId, ["_thumbnail_id"])
        .then(parse)
        .then(() => {
          setFormData({
            meta_input: formData?.meta_input,
          });
          setFeaturedImage(undefined);
        })
    );
  };

  const handleUpdate = (thumbnail: wpCoreTypes.actions.Posts[number]) => {
    const postId = formData?.ID;
    if (!postId) return;

    overlay.circular.promise(
      actions.meta
        .update("post", postId, {
          _thumbnail_id: thumbnail.ID,
        })
        .then(parse)
        .then(() => {
          setFormData({
            meta_input: {
              ...formData.meta_input,
              _thumbnail_id: thumbnail.ID,
            },
          });
        })
    );
  };

  return (
    <Box>
      <FormControl sx={{ gap: 1, display: "grid", gridTemplateColumns: "1fr" }}>
        <CardImage
          component="a"
          src={featuredImage?.guid}
          onClick={() =>
            mediaSelector.open(["image"], (post) => handleUpdate(post))
          }
          alt={featuredImage?.post_title}
          placeholder="No featured image"
        />
      </FormControl>
      {featuredImage && (
        <Box>
          <AdminLink onClick={handleRemove}>
            <Typography color="error">Remove</Typography>
          </AdminLink>
        </Box>
      )}
    </Box>
  );
};
