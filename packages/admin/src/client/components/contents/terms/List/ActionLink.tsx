import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { useContext } from "react";

import { Box } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import { AdminLink } from "../../../../components/utils/link";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";
import { TermsContext } from "./";

export const ActionLink = (props: {
  term: wpCoreTypes.actions.Terms[number];
}) => {
  const { term } = props;
  const { overlay } = useWPAdmin();
  const { refresh } = useAdminNavigation();
  const { actions, safeParse } = useServerActions();
  const { edit, setEdit, permissions, taxonomy } = useContext(TermsContext);

  const handleEditOpen = (term: wpCoreTypes.actions.Terms[number]) => () => {
    setEdit({
      ...edit,
      open: true,
      selectedTerm: term,
    });
  };

  const handleDelete = (term: wpCoreTypes.actions.Terms[number]) => () => {
    if (!taxonomy) {
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
          .promise(actions.term.del(term.term_id, taxonomy.name))
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
      {permissions?.edit_terms && (
        <AdminLink onClick={handleEditOpen(term)}>Edit</AdminLink>
      )}
      {permissions?.delete_terms && (
        <AdminLink color="error" onClick={handleDelete(term)}>
          Delete
        </AdminLink>
      )}
    </Box>
  );
};
