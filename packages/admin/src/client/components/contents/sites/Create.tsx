import { useState } from "react";

import { Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { FormControl, FormLabel } from "@rnaga/wp-next-ui/Form";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation, useSites } from "../../../hooks";
import { useWPAdmin } from "../../../wp-admin";

import type * as types from "../../../../types";

export const Create = () => {
  const wpAdmin = useWPAdmin();
  const { updateSites } = useSites();
  const {
    wp: {
      viewport,
      globalState: { get: globalStateGet, set: globalStateSet },
    },
    overlay,
  } = wpAdmin;
  const { formData, submit, validation } =
    useFormData<types.client.formdata.SiteCreate>("site-create");
  const { actions, safeParse } = useServerActions();
  const [loading, setLoading] = useState(false);

  const open = globalStateGet("site-create-site-modal").open;
  const { gotoPath } = useAdminNavigation();

  const validate = (data: typeof formData): true | [false, string] => {
    if (data.path.length > 0 && !/^\//.test(data.path)) {
      return [false, "Invalid path"];
    }
    return true;
  };

  const handleSubmit = async (data: typeof formData) => {
    setLoading(true);
    const result = await actions.site.create(data).then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      setLoading(false);
      return;
    }

    if (await updateSites()) {
      globalStateSet("site-create-site-modal", { open: false });
      gotoPath("/sites/edit", {
        segment: "site",
        queryParams: {
          id: result.data.siteId,
        },
      });
    }
    setLoading(false);
  };

  const handleClose = () => {
    globalStateSet("site-create-site-modal", { open: false });
  };

  return (
    <Modal open={open} onClose={handleClose} sx={{ zIndex: 2 }}>
      <ModalContent
        sx={{
          minWidth: 350,
        }}
      >
        <Typography size="large" bold sx={{ mb: 2 }}>
          New Site
        </Typography>
        <Typography color="error">{validation?.error}</Typography>
        <form onSubmit={submit(handleSubmit, validate)}>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Domain</FormLabel>
              <Input size="medium" name="domain" required />
            </FormControl>

            <FormControl>
              <FormLabel>Path </FormLabel>
              <Input size="medium" name="path" value="/" required />
            </FormControl>

            <FormControl>
              <FormLabel>Site Name</FormLabel>
              <Input size="medium" name="siteName" required />
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
