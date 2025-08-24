import { useEffect, useState } from "react";

import { Box } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { LinkCopy } from "@rnaga/wp-next-ui/LinkCopy";

import { useWPAdmin } from "../../../../../wp-admin";

export const GenerateResetLinkModal = (props: {
  open: boolean;
  onClose: (...args: any) => any;
  userLogin?: string;
}) => {
  const { open, onClose, userLogin } = props;
  const {
    site,
    overlay,
    wp: { viewport },
  } = useWPAdmin();
  const { actions, safeParse } = useServerActions();

  const [resetKey, setResetKey] = useState<string>();

  useEffect(() => {
    if (!open || !userLogin) {
      return;
    }

    overlay.circular
      .promise(actions.password.requestResetKey(userLogin))
      .then((response) => {
        const result = safeParse(response);
        if (!result.success || typeof result.data !== "string") {
          overlay.snackbar.open("error", result.error);
          return;
        }

        setResetKey(result.data);
      });
  }, [open, userLogin]);

  const resetLink = `${site.baseUrl}/auth/reset?key=${resetKey}&user_login=${userLogin}`;

  if (!open || !resetKey) {
    return null;
  }

  return (
    <Modal open={true} onClose={onClose} sx={{ zIndex: 2 }}>
      <ModalContent sx={{ minWidth: "50%" }}>
        <Typography component="h2" size="large" bold>
          Reset link
        </Typography>
        <Box>
          <Typography
            component="div"
            size="medium"
            color="primary"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              verticalAlign: "middle",
              my: 2,
            }}
          >
            <LinkCopy link={resetLink} showIcon={true} /> {resetLink}
          </Typography>

          <Typography bold size="medium">
            The same link might have been sent out to the email.
          </Typography>
        </Box>
      </ModalContent>
    </Modal>
  );
};
