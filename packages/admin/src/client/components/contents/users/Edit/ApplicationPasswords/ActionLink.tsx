import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { useContext } from "react";

import { Box } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import { useWPAdmin } from "../../../../../wp-admin";
import { useAdminNavigation } from "../../../../../hooks/use-admin-navigation";
import { AdminLink } from "../../../../../components/utils/link";

export const ActionLink = (props: {
  password: wpCoreTypes.actions.ApplicationPasswords[number];
}) => {
  const { password } = props;
  const { overlay } = useWPAdmin();
  const { refresh } = useAdminNavigation();
  const { actions, safeParse } = useServerActions();

  const handleDelete = (uuid: string) => () => {
    if (!password) {
      return;
    }
    const message =
      "This action cannot be undone. This will permanently delete your item.";
    const title = "Are you absolutely sure?";
    overlay.confirm.open(
      message,
      async (confirm) => {
        if (!confirm) {
          return;
        }
        const result = await overlay.circular
          .promise(actions.applicationPasswords.del(uuid))
          .then(safeParse);
        if (!result.success) {
          overlay.snackbar.open("error", result.error);
          return;
        }
        overlay.snackbar.open("success", "Item has been deleted Permanently");
        refresh(["content"]);
      },
      title
    );
  };

  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      <AdminLink color="error" onClick={handleDelete(password.uuid)}>
        Delete
      </AdminLink>
    </Box>
  );
};
