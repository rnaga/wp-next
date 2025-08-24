import { useEffect, useState } from "react";

import { Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { FormControl, FormLabel } from "@rnaga/wp-next-ui/Form";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useSites } from "../../../hooks/use-sites";
import { useWPAdmin } from "../../../wp-admin";

import type * as types from "../../../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Create = () => {
  const { updateSites } = useSites();
  const wpAdmin = useWPAdmin();
  const {
    overlay,
    site: { siteId, isSubdomainInstall },
    wp: {
      viewport,
      globalState: { get: globalStateGet, set: globalStateSet },
    },
  } = wpAdmin;

  const { formData, submit } =
    useFormData<types.client.formdata.BlogCreate>("blog");
  const { actions, safeParse, parse } = useServerActions();
  const [loading, setLoading] = useState(false);

  const { gotoPath } = useAdminNavigation();

  const [blog, setBlog] = useState<wpCoreTypes.actions.Blog>();

  const open = globalStateGet("blog-create-blog-modal").open;

  useEffect(() => {
    if (!siteId || 0 >= siteId || !open) {
      return;
    }

    overlay.circular.promise(actions.blog.get(siteId)).then((response) => {
      const [blog] = parse(response);
      setBlog(blog);
    });
  }, [siteId, open]);

  const handleClose = () => {
    globalStateSet("blog-create-blog-modal", { open: false });
  };

  const handleSubmit = async (data: typeof formData) => {
    setLoading(true);
    const result = await actions.blog
      .create({
        ...data,
        path: blog?.path ?? "/",
      })
      .then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      setLoading(false);
      return;
    }

    const blogId = result.data;
    if (await updateSites()) {
      globalStateSet("blog-create-blog-modal", { open: false });
      gotoPath("/blogs/edit", {
        //segment: "site",
        queryParams: {
          id: blogId,
        },
      });
    }
    setLoading(false);
  };

  if (!blog) {
    return null;
  }

  return (
    <Modal open={open} onClose={handleClose} sx={{ zIndex: 2 }}>
      <ModalContent>
        <Typography
          size="large"
          sx={{
            mb: 2,
          }}
          bold
        >
          New Blog
        </Typography>
        <form onSubmit={submit(handleSubmit)}>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel required>Blog Address (URL)</FormLabel>
              <Input
                size="medium"
                name="domain"
                required
                startAdornment={isSubdomainInstall ? null : <>{blog.domain}/</>}
                endAdornment={isSubdomainInstall ? <>.{blog.domain}</> : null}
              />
            </FormControl>
            <FormControl>
              <FormLabel required>Blog Name</FormLabel>
              <Input size="medium" name="title" required />
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
