import type * as types from "../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

type Comment = NonNullable<
  wpCoreTypes.client.GlobalState["comment-edit-modal"]
>["comment"];

export const useComment = (props: {
  globalState: wpCoreTypes.client.WP["globalState"];
}) => {
  const { globalState } = props;
  const commentEditModal = globalState.get("comment-edit-modal");

  const open = (
    comment: Comment,
    isReply: boolean,
    onSave?: (data: types.client.formdata.CommentUpsert) => void
  ) => {
    globalState.set({
      "comment-edit-modal": {
        open: true,
        isReply,
        comment,
        onSave,
      },
    });
  };

  const close = () => {
    globalState.set({
      "comment-edit-modal": {
        open: false,
        isReply: false,
        comment: undefined,
        onSave: undefined,
      },
    });
  };

  return {
    open,
    close,
    comment: commentEditModal?.comment,
    isReply: !!commentEditModal?.isReply,
    isOpen: !!commentEditModal?.open,
    onSave: commentEditModal?.onSave,
  };
};
