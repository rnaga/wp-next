"use client";
import { useEffect, useState, useTransition } from "react";

import { Box, FormControl, FormLabel, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { BasicMenuButton } from "@rnaga/wp-next-ui/BasicMenuButton";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { IconButtonDelete } from "@rnaga/wp-next-ui/IconButtonDelete";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Loading } from "@rnaga/wp-next-ui/Loading";

import * as types from "../../../../../../types";
import { useAdminNavigation } from "../../../../../hooks/use-admin-navigation";
import { useAdminUser } from "../../../../../hooks/use-admin-user";
import { useWPAdmin } from "../../../../../wp-admin";
import { GenerateResetLinkModal } from "./GenerateResetLinkModal";
import { ResetPasswordModal } from "./ResetPasswordModal";

export const Profile = (props: { userId: number }) => {
  const { userId } = props;
  const {
    overlay,
    wp: { error },
  } = useWPAdmin();
  const { user, updateAdminUser } = useAdminUser();
  const { goto } = useAdminNavigation();
  const { actions, safeParse } = useServerActions();
  const [loading, startTransition] = useTransition();

  const [state, setState] = useState({
    passwordModal: false,
    showResetLink: false,
    canDeleteUser: false,
  });

  const { formData, setFormData, submit } =
    useFormData<types.client.formdata.UserUpdate>("user");

  useEffect(() => {
    startTransition(async () => {
      const response = await actions.user.get(userId).then(safeParse);

      if (!response.success || !response.data) {
        error.throw(response.error ?? "Failed to get user data");
      }

      const { user_pass, ...formData } = response.data;
      const canDeleteUser = !!(await actions.user.can("delete_user", userId))
        .data;

      setFormData(formData);
      setState({ ...state, canDeleteUser });
    });
  }, [userId]);

  const toggleGenerateResetLink = (value: boolean) => {
    setState({ ...state, showResetLink: value });
  };

  const toggleResetPassword = (value: boolean) => {
    setState({ ...state, passwordModal: value });
  };

  const handleDelete = () => {
    goto(`delete?id=${userId}`);
  };

  const handleSubmit = async (data: typeof formData) => {
    data = {
      ...data,
      role: undefined, // Not to update role via profile page
      meta_input: {
        nickname: data.nickname,
        last_name: data.last_name,
        first_name: data.first_name,
        description: data.description,
      },
    };

    const result = await overlay.circular
      .promise(actions.user.update(userId, data))
      .then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    if (userId == user?.ID) {
      updateAdminUser();
    }
  };

  return (
    <>
      <GenerateResetLinkModal
        open={state.showResetLink}
        onClose={() => toggleGenerateResetLink(false)}
        userLogin={formData.user_login}
      />
      <ResetPasswordModal
        open={state.passwordModal}
        userId={userId}
        onClose={() => toggleResetPassword(false)}
      />
      <Loading
        loading={loading}
        sx={{
          mt: 2,
        }}
      >
        <form onSubmit={submit(handleSubmit)}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1.5,
              height: 36,
              mt: 1,
            }}
          >
            <Button size="medium" type="submit">
              Save
            </Button>
            {state.canDeleteUser && (
              <IconButtonDelete title="Delete User" onClick={handleDelete} />
            )}

            <BasicMenuButton
              size="medium"
              label="Reset Password"
              showArrowIcon={false}
              items={[
                {
                  label: "Generate Reset Link",
                  value: "generate",
                },
                {
                  label: "Set New Password",
                  value: "set",
                },
              ]}
              onChange={(value) => {
                if (value === "generate") {
                  toggleGenerateResetLink(true);
                } else if (value === "set") {
                  toggleResetPassword(true);
                }
              }}
              sx={{
                minWidth: 200,
                height: "100%",
                backgroundColor: (theme) => theme.palette.background.paper,
              }}
            />
          </Box>

          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Username</FormLabel>
              <Input
                size="large"
                name="user_login"
                value={formData.user_login || ""}
                disabled
              />
            </FormControl>

            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: "1fr 1fr",
              }}
            >
              <FormControl>
                <FormLabel required>Nickname (required)</FormLabel>
                <Input size="large" name="nickname" value={formData.nickname} />
              </FormControl>

              <FormControl>
                <FormLabel>Display Name</FormLabel>
                <Input
                  size="large"
                  name="display_name"
                  value={formData.display_name}
                />
              </FormControl>
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: "1fr 1fr",
              }}
            >
              <FormControl>
                <FormLabel>First Name</FormLabel>
                <Input
                  size="large"
                  name="first_name"
                  value={formData.first_name}
                  placeholder="First Name"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Last Name</FormLabel>
                <Input
                  size="large"
                  name="last_name"
                  value={formData.last_name}
                  placeholder="Last Name"
                />
              </FormControl>
            </Box>

            <FormControl>
              <FormLabel required>Email (required)</FormLabel>
              <Input
                size="large"
                name="user_email"
                value={formData.user_email}
              ></Input>
            </FormControl>

            <FormControl>
              <FormLabel>Website</FormLabel>
              <Input
                size="large"
                name="user_url"
                value={formData.user_url}
              ></Input>
            </FormControl>

            <FormControl>
              <FormLabel>Biographical Info</FormLabel>
              <Input
                multiline
                size="large"
                name="description"
                value={formData.description}
                minRows={4}
                maxRows={10}
              />
            </FormControl>
          </Stack>
        </form>
      </Loading>
    </>
  );
};
