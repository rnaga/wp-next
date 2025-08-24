"use client";
import { Box, FormControl } from "@mui/material";
import { Input } from "@rnaga/wp-next-ui/Input";

import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";

import type * as types from "../../../../../types";
export const Excerpt = () => {
  const { formData, setFormData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");

  return (
    <Box sx={{ mt: 2 }}>
      <FormControl sx={{ gap: 1, display: "grid", gridTemplateColumns: "1fr" }}>
        <Input
          key={formData?.ID ?? 0}
          placeholder="Write An Excerpt (Optional)"
          minRows={4}
          maxRows={4}
          multiline
          value={formData?.post_excerpt}
          onChange={(v) => formData && setFormData({ post_excerpt: v })}
        />
      </FormControl>
    </Box>
  );
};
