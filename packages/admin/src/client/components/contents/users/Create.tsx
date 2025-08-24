"use client";
import { FormControl, FormLabel, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation } from "../../../hooks";
import { useWPAdmin } from "../../../wp-admin";

import type * as types from "../../../../types";
import { useState } from "react";

export const Create = () => {
  const {
    overlay,
    wp: { globalState },
  } = useWPAdmin();
  const { gotoPath } = useAdminNavigation();
  const { actions, safeParse } = useServerActions();
  const [loading, setLoading] = useState(false);

  const { formData, submit } =
    useFormData<types.client.formdata.UserCreate>("user");

  const open = globalState.get("user-create-user-modal")?.open;

  const onClose = () => {
    globalState.set("user-create-user-modal", { open: false });
  };

  const handleSubmit = async (data: typeof formData) => {
    setLoading(true);
    const result = await actions.user
      .create({
        user_login: data.user_login,
        user_email: data.user_email,
        nickname: data.nickname,
      })
      .then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    gotoPath("/users/edit", {
      queryParams: {
        id: result.data.ID,
      },
    });

    setLoading(false);
    onClose();
  };

  return (
    <Modal open={!!open} onClose={onClose} sx={{ zIndex: 2 }}>
      <ModalContent
        sx={{
          minWidth: "30%",
        }}
      >
        <Typography bold fontSize={20}>
          New User
        </Typography>

        <form onSubmit={submit(handleSubmit)}>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input size="medium" name="user_login" required />
            </FormControl>

            <FormControl>
              <FormLabel>Email </FormLabel>
              <Input size="medium" name="user_email" required />
            </FormControl>

            <FormControl>
              <FormLabel>Nickname</FormLabel>
              <Input size="medium" name="nickname" required />
            </FormControl>
            <Button size="medium" type="submit" loading={loading}>
              Submit
            </Button>
          </Stack>
        </form>
      </ModalContent>
    </Modal>
  );
};
