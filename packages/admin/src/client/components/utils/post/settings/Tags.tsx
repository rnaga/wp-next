"use client";

import { Box, FormControl } from "@mui/material";
import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { SelectWPTags } from "@rnaga/wp-next-ui/SelectWPTerms";

import type * as types from "../../../../../types";

export const Tags = () => {
  const { formData, setFormData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");

  return (
    <Box>
      <FormControl id="tags" sx={{ width: "100%" }}>
        <SelectWPTags
          size="medium"
          freeSolo
          value={(formData.tags_input as number[]) ?? []}
          onChange={(tags) => {
            setFormData({ tags_input: tags });
          }}
        />
      </FormControl>
    </Box>
  );
};
