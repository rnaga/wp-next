import { useState } from "react";

import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { FormControl, FormLabel, IconButton, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useWPAdmin } from "../../../../../wp-admin";

export const ResetPasswordModal = (props: {
  open: boolean;
  userId: number;
  onClose: (...args: any) => any;
}) => {
  const { open, userId, onClose } = props;
  const {
    wp: { viewport },
    overlay,
  } = useWPAdmin();
  const { actions, safeParse } = useServerActions();
  const { formData, submit, validation } = useFormData<{
    password: string;
    confirmed: string;
  }>("reset-password");

  const [visibility, setVisibility] = useState(false);

  const validator = (data: typeof formData): true | [false, string] => {
    if (
      0 >= data.password.length ||
      0 >= data.confirmed.length ||
      data.password !== data.confirmed
    ) {
      return [false, "Confirmed password does not match"];
    }

    return true;
  };

  const handleSubmit = async (data: typeof formData) => {
    const newPassword = data.password.trim();

    const result = await overlay.circular
      .promise(actions.user.updatePassword(userId, newPassword))
      .then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} sx={{ zIndex: 2 }}>
      <form onSubmit={submit(handleSubmit, validator)}>
        <ModalContent>
          <Typography size="large" bold>
            Reset Password
          </Typography>
          <Stack spacing={1.5}>
            {!validation?.valid && (
              <Typography color="danger">{validation?.error}</Typography>
            )}
            <FormControl focused={false}>
              <FormLabel>New Password</FormLabel>
              <Input
                name="password"
                size="large"
                autoFocus
                required
                type={visibility ? "text" : "password"}
                endAdornment={
                  <IconButton
                    onClick={() => {
                      setVisibility(!visibility);
                    }}
                  >
                    {visibility ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                }
              />
            </FormControl>
            <FormControl focused={false}>
              <FormLabel>Confirm Password</FormLabel>
              <Input type="password" name="confirmed" required size="large" />
            </FormControl>
            <Button type="submit" size="large">
              Submit
            </Button>
          </Stack>
        </ModalContent>
      </form>
    </Modal>
  );
};
