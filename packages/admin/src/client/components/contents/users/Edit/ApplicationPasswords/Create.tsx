import { useState } from "react";

import { FormControl, FormLabel, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { LinkCopy } from "@rnaga/wp-next-ui/LinkCopy";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const Create = (props: {
  open: boolean;
  onClose: () => void;
  onCreate: () => void;
}) => {
  const { open, onClose, onCreate } = props;
  const [loading, setLoading] = useState(false);
  const { actions, safeParse } = useServerActions();
  const { formData, setFormData, submit } = useFormData<{
    name: string;
  }>("application-password");

  const [response, setResponse] = useState<
    | {
        success: boolean;
        data?: { password: string };
        error?: string;
      }
    | undefined
  >();

  const handleSubmit = async (data: typeof formData) => {
    setLoading(true);

    const response = await actions.applicationPasswords
      .create(data)
      .then(safeParse);

    if (response.success) {
      setResponse({ success: true, data: response.data });
      onCreate();
    } else {
      setResponse({
        success: false,
        error: response.error || "Failed to create application password",
      });
    }

    setLoading(false);
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent
        sx={{
          minWidth: 400,
        }}
      >
        <Typography bold fontSize={18} mb={2}>
          Create New Password
        </Typography>
        {response?.error && (
          <Typography color="error" mb={2}>
            {response.error}
          </Typography>
        )}
        {response?.success && response.data && (
          <>
            <Typography mb={2} size="medium">
              Please copy your new application password.
            </Typography>
            <Typography
              sx={{
                wordBreak: "break-all",
                p: 2,
                backgroundColor: (theme) =>
                  theme.palette.mode === "light"
                    ? "rgba(0,0,0,.05)"
                    : "rgba(255,255,255,.05)",
                borderRadius: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {response.data.password}
              <LinkCopy link={response.data.password} showIcon={true} />
            </Typography>
          </>
        )}

        {!response && (
          <form onSubmit={submit(handleSubmit)}>
            <Stack spacing={2}>
              <FormControl>
                <FormLabel required>Name</FormLabel>
                <Input
                  size="medium"
                  name="name"
                  value={formData?.name}
                  required
                />
              </FormControl>

              <Button size="medium" type="submit" loading={loading}>
                Submit
              </Button>
            </Stack>
          </form>
        )}
      </ModalContent>
    </Modal>
  );
};
