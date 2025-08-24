import { Box } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../wp-admin";
import { AdminLink } from "../../utils/link/AdminLink";

import type { Comment } from "./List";

export const ActionLink = (props: { comment: Comment }) => {
  const { comment } = props;
  const { overlay, comment: commentModal } = useWPAdmin();
  const { actions, safeParse } = useServerActions();
  const { refresh } = useAdminNavigation();

  let commentStatus: "0" | "1" | "spam" | "trash" = "0";
  switch (`${comment.comment_approved}`) {
    case "1":
    case "approve":
      commentStatus = "1";
      break;
    case "spam":
      commentStatus = "spam";
      break;
    case "trash":
    case "post-trashed":
      commentStatus = "trash";
      break;
    case "0":
    case "hold":
    default:
      commentStatus = "0";
      break;
  }

  const handleApprove = (approve: "0" | "1" | "trash" | "spam") => async () => {
    const result = await overlay.circular.promise(
      actions.comment
        .update(comment.comment_ID, {
          comment_approved: approve,
          comment_type: comment.comment_type,
        })
        .then(safeParse)
    );
    if (result.error) {
      overlay.snackbar.open("error", result.error);
      return;
    }
    overlay.snackbar.open("success", "Item has been updated");
    refresh(["content"]);
  };

  const handleEditOpen = (isReply: boolean) => async () => {
    commentModal.open(comment, isReply, () => refresh(["content"]));
  };

  const handleDelete = () => {
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
          .promise(actions.comment.del(comment.comment_ID, true))
          .then(safeParse);

        if (!result.success) {
          overlay.snackbar.open("error", result.error);
          return;
        }

        overlay.snackbar.open("error", "Item has been deleted Permanently");
        refresh(["content"]);
      },
      title
    );
  };

  return (
    <Box sx={{ display: "flex", gap: 0.5 }}>
      {commentStatus == "1" && (
        <AdminLink color="warning" onClick={handleApprove("0")}>
          Unapprove
        </AdminLink>
      )}
      {commentStatus == "0" && (
        <AdminLink color="success" onClick={handleApprove("1")}>
          Approve
        </AdminLink>
      )}
      {commentStatus.match(/^0|1$/) && (
        <AdminLink onClick={handleEditOpen(true)}>Reply</AdminLink>
      )}
      {commentStatus.match(/^0|1$/) && (
        <AdminLink onClick={handleEditOpen(false)}>Edit</AdminLink>
      )}
      {commentStatus.match(/^0|1|trash$/) && (
        <AdminLink color="error" onClick={handleApprove("spam")}>
          Spam
        </AdminLink>
      )}
      {commentStatus.match(/^0|1$/) && (
        <AdminLink color="error" onClick={handleApprove("trash")}>
          Trash
        </AdminLink>
      )}
      {commentStatus == "spam" && (
        <AdminLink color="warning" onClick={handleApprove("0")}>
          Not Spam
        </AdminLink>
      )}
      {commentStatus == "trash" && (
        <AdminLink color="success" onClick={handleApprove("0")}>
          Restore
        </AdminLink>
      )}
      {commentStatus.match(/^trash|spam$/) && (
        <AdminLink color="error" onClick={handleDelete}>
          Delete Permanently
        </AdminLink>
      )}
    </Box>
  );
};
