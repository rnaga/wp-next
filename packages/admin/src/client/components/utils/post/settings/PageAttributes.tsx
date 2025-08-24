"use client";

import { FormControl, Stack } from "@mui/material";
import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { SelectWPPost } from "@rnaga/wp-next-ui/SelectWPPost";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import type * as types from "../../../../../types";

export const PageAttributes = () => {
  const { formData, setFormData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");

  return (
    <Stack spacing={1.5}>
      <FormControl id="parent">
        <Typography>Parent</Typography>

        <SelectWPPost
          size="medium"
          onChange={(post) => {
            setFormData({ post_parent: post.ID });
          }}
          postOptions={{
            postTypes: ["page"],
          }}
          defaultValue={formData.post_parent ?? 0}
        />
      </FormControl>
      <FormControl id="order">
        <Typography>Menu Order</Typography>
        <Input
          type="number"
          size="medium"
          value={
            !formData.menu_order || 0 > formData.menu_order
              ? ""
              : formData.menu_order
          }
          onChange={(value) => {
            if (value.match(/^[0-9]+$/) === null) {
              setFormData({ menu_order: 0 });
              return;
            }
            setFormData({ menu_order: parseInt(value) });
          }}
        />
      </FormControl>
    </Stack>
  );
};
