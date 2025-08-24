"use client";

import { Box, FormControl } from "@mui/material";
import { Checkbox } from "@rnaga/wp-next-ui/Checkbox";
import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";

import type * as types from "../../../../../types";

export const Discussion = () => {
  const { formData, setFormData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");

  return (
    <Box>
      <FormControl sx={{ gap: 1, display: "grid", gridTemplateColumns: "1fr" }}>
        <Checkbox
          size="small"
          key={`comment_status_${formData?.ID ?? 0}`}
          label="Allow comments"
          checked={formData?.comment_status == "open" ? true : false}
          sx={{
            py: 1,
            ":hover": {
              bgcolor: (theme) => theme.palette.divider,
            },
          }}
          onChange={(v) =>
            formData &&
            setFormData({
              comment_status: v.target.checked ? "open" : "closed",
            })
          }
        />
      </FormControl>
      <FormControl sx={{ gap: 1, display: "grid", gridTemplateColumns: "1fr" }}>
        <Checkbox
          size="small"
          key={`ping_status_${formData?.ID ?? 0}`}
          label="Allow pingbacks & trackbacks"
          checked={formData?.ping_status == "open" ? true : false}
          sx={{
            py: 1,
            ":hover": {
              bgcolor: (theme) => theme.palette.divider,
            },
          }}
          onChange={(v) =>
            formData &&
            setFormData({
              ping_status: v.target.checked ? "open" : "closed",
            })
          }
        />
      </FormControl>
    </Box>
  );
};
