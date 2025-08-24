import { FormControl, FormLabel, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { LightEditor } from "@rnaga/wp-next-rte/tiptap/LightEditor";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useWPAdmin } from "../../../wp-admin";

import type * as types from "../../../../types";

export const CommentModal = () => {
  const { overlay, comment: commentModal } = useWPAdmin();
  const { actions, safeParse } = useServerActions();

  const { comment, isReply, isOpen, onSave } = commentModal;

  const { formData, submit, setFormData } =
    useFormData<types.client.formdata.CommentUpsert>("comment");

  const handleSubmit = async (data: typeof formData) => {
    let commentData = {
      ...data,
      comment_post_ID: parseInt(`${data.comment_post_ID}`),
    };

    const commentId = parseInt(`${data.comment_ID}`);
    if (!isReply && 0 >= commentId) {
      return;
    }

    if (isReply) {
      commentData = {
        ...commentData,
        comment_parent: parseInt(`${data.comment_parent}`),
      };
    }

    const action = !isReply
      ? actions.comment.update(commentId, commentData)
      : actions.comment.create(commentData);

    const result = await overlay.circular.promise(action.then(safeParse));

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    onSave?.(data);
    commentModal.close();
  };

  return (
    <Modal
      open={isOpen}
      onClose={() => commentModal.close()}
      sx={{ zIndex: 2 }}
    >
      <ModalContent minWidth={"50%"}>
        <Typography size="large" bold>
          {isReply ? "Reply" : "Edit"}
        </Typography>

        <form onSubmit={submit(handleSubmit)}>
          <input
            type="hidden"
            name="comment_post_ID"
            defaultValue={comment?.comment_post_ID}
          />
          <Stack spacing={2}>
            {isReply && (
              <>
                <input
                  type="hidden"
                  name="comment_parent"
                  defaultValue={comment?.comment_ID}
                />
                <input type="hidden" name="comment_approve" defaultValue="1" />
              </>
            )}
            {!isReply && (
              <>
                <input
                  type="hidden"
                  name="comment_ID"
                  defaultValue={comment?.comment_ID}
                />
                <FormControl>
                  <FormLabel required>Name</FormLabel>
                  <Input
                    size="medium"
                    name="comment_author"
                    value={comment?.comment_author}
                    required
                  />
                </FormControl>
                <FormControl>
                  <FormLabel required>Email</FormLabel>
                  <Input size="medium" name="comment_email" required />
                </FormControl>
                <FormControl>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={comment?.comment_approved ?? "0"}
                    size="medium"
                    enum={[
                      { label: "Approve", value: "1" },
                      { label: "Unapprove", value: "0" },
                      { label: "Spam", value: "spam" },
                      { label: "Trash", value: "trash" },
                    ]}
                    onChange={(value) =>
                      setFormData({
                        comment_approved: value as any,
                      })
                    }
                  />
                </FormControl>
              </>
            )}
            <FormControl>
              <LightEditor
                defaultContent={isReply ? "" : comment?.comment_content}
                minHeight={200}
                maxHeight={300}
                onUpdate={(editor, transaction) => {
                  setFormData({ comment_content: editor.getHTML() });
                }}
              />
            </FormControl>
            <Button type="submit">Submit</Button>
          </Stack>
        </form>
      </ModalContent>
    </Modal>
  );
};
