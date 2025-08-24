"use client";
import { useState } from "react";

import { Box, FormControl } from "@mui/material";
import { useUser } from "@rnaga/wp-next-core/client/hooks";
import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { SelectWPCategories } from "@rnaga/wp-next-ui/SelectWPTerms";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { AdminLink } from "../../../../components/utils/link";
import { TermModal } from "../../../../components/utils/modal";

import type * as types from "../../../../../types";

export const Categories = () => {
  const { formData, setFormData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");

  const { userCan } = useUser();

  const [open, setOpen] = useState(false);
  const [key, setKey] = useState(Math.random());

  const handleNewCategoryCreated = (term: { term_id: number }) => {
    setFormData({
      post_categeory: [...(formData.post_categeory ?? []), term.term_id],
    });
    setKey(Math.random());
  };

  return (
    <Box>
      <FormControl id="categories" sx={{ width: "100%" }}>
        <SelectWPCategories
          size="medium"
          value={formData.post_categeory?.join(",") ?? ""}
          onChange={(categories) =>
            setFormData({ post_categeory: categories.map(Number) })
          }
        />
      </FormControl>

      {userCan("manage_categories") && (
        <Box>
          <AdminLink onClick={() => setOpen(true)}>
            <Typography bold>Add New Category</Typography>
          </AdminLink>
          <TermModal
            open={open}
            onClose={() => setOpen(false)}
            onSave={handleNewCategoryCreated}
            taxonomy="category"
          />
        </Box>
      )}
    </Box>
  );
};
