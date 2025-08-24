import { useEffect, useState } from "react";

import RestoreIcon from "@mui/icons-material/Restore";
import { Box } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";

import type * as types from "../../../../../types";

export const Revisions = () => {
  const { gotoPath, refreshValue } = useAdminNavigation();
  const { formData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");
  const { actions, safeParse } = useServerActions();
  const { wpTheme } = useWPTheme();

  const [hasRevisions, setHasRevisions] = useState(0);

  useEffect(() => {
    if (!formData.ID) {
      return;
    }

    actions.revision.list(formData.ID, { per_page: 30 }).then((response) => {
      const result = safeParse(response);
      if (!result.success) {
        return;
      }

      setHasRevisions(result.data.length);
    });
  }, [formData.ID, refreshValue().content]);

  if (0 >= hasRevisions) {
    return (
      <Box>
        <Typography size="medium">No revisions available</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="button"
      onClick={() =>
        gotoPath("/revisions", {
          segment: "blog",
          queryParams: {
            id: formData.ID,
          },
        })
      }
      sx={{
        display: "flex",
        justifyContent: "flex-start",
        gap: 2,
        alignItems: "center",
        cursor: "pointer",
        border: 0,
      }}
    >
      <RestoreIcon fontSize="small" />
      <Typography bold>{hasRevisions} Revisions</Typography>
    </Box>
  );
};
