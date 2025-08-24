import moment from "moment-timezone";
import { useEffect, useState } from "react";

import { Box, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Checkbox } from "@rnaga/wp-next-ui/Checkbox";
import { FormControl, FormLabel } from "@rnaga/wp-next-ui/Form";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";
import { SelectWPTerm } from "@rnaga/wp-next-ui/SelectWPTerm";

import { useAdminNavigation, useSites } from "../../../hooks";
import { useWPAdmin } from "../../../wp-admin";

import type * as types from "../../../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Settings = () => {
  const { site, overlay } = useWPAdmin();
  const { refresh } = useAdminNavigation();
  const { actions, safeParse, parse } = useServerActions();
  const { updateSites } = useSites();

  const { setFormData, formData, submit, setFormReady, formReady } =
    useFormData<types.client.formdata.OptionsUpdate>("options");

  const [options, setOptions] = useState<wpCoreTypes.actions.Options>();

  useEffect(() => {
    (async () => {
      const [options] = await overlay.circular
        .promise(actions.options.getAll())
        .then(parse);
      setOptions(options);
      setFormReady(true);
    })();
  }, []);

  const handleSubmit = async (data: typeof formData) => {
    const result = await overlay.circular
      .promise(actions.options.update(data))
      .then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    overlay.snackbar.open("success", "Settings have been updated");

    updateSites();
    refresh(["header"]);
  };

  const handleCheckbox =
    (name: keyof types.client.formdata.OptionsUpdate) => (e: any) => {
      setFormData({ [name]: e.target.checked ? 1 : 0 });
    };

  if (!options || !formReady) return null;

  return (
    <Box sx={{ pb: 10 }}>
      <form onSubmit={submit(handleSubmit)}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
          }}
        >
          <Button size="medium" type="submit">
            Save
          </Button>
        </Box>
        <Stack spacing={2} sx={{ rowGap: 1, display: "flex" }}>
          <FormControl>
            <FormLabel>Blog Name</FormLabel>
            <Input
              size="large"
              name="blogname"
              value={options.blogname}
              placeholder="Blog Name"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Blog Description</FormLabel>
            <Input
              size="large"
              name="blogdescription"
              value={options.blogdescription}
              placeholder="Blog Description"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Administration Email Address</FormLabel>
            <Input
              size="large"
              name="admin_email"
              value={options.admin_email}
              placeholder="Administration Email Address"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Timezone</FormLabel>
            <SelectAutocomplete
              size="medium"
              onChange={(value) => {
                setFormData({ timezone_string: value });
              }}
              value={options.timezone_string || "Etc/UTC"}
              items={moment.tz.names().map((name) => ({
                label: name,
                value: name,
              }))}
              disableClearable
            />
          </FormControl>
          <FormControl>
            <FormLabel>Default Post Category</FormLabel>
            <SelectWPTerm
              size="medium"
              taxonomy="category"
              defaultValue={options.default_category}
              onChange={(term) =>
                setFormData({ default_category: term.term_id })
              }
            />
          </FormControl>
          {!site.isMultiSite && (
            <FormControl>
              <FormLabel>Membership</FormLabel>
              <Checkbox
                size="medium"
                defaultChecked={options.users_can_register == "1"}
                onChange={handleCheckbox("users_can_register")}
                label="Anyone can register"
              />
            </FormControl>
          )}
          <Stack spacing={1.5}>
            <FormLabel>Comments Settings</FormLabel>

            <Checkbox
              size="medium"
              defaultChecked={options.require_name_email == "1"}
              onChange={handleCheckbox("require_name_email")}
              label="Comment author must fill out name and email"
            />
            <Checkbox
              size="medium"
              value={1}
              name="comment_registration"
              defaultChecked={options.comment_registration == "1"}
              onChange={(e) => console.log(e.target.checked)}
              label="Users must be registered and logged in to comment"
            />
            <Checkbox
              size="medium"
              value={1}
              defaultChecked={options.comment_moderation == "1"}
              onChange={handleCheckbox("comment_moderation")}
              label="Comment must be manually approved"
            />
            <Checkbox
              size="medium"
              value={1}
              defaultChecked={options.comment_previously_approved == "1"}
              onChange={handleCheckbox("comment_previously_approved")}
              label="Comment author must have a previously approved comment"
            />
            <FormLabel>Comment Moderation</FormLabel>
            <InputMultiple
              size="medium"
              onChange={(value) => {
                setFormData({ moderation_keys: value.join("\n") });
              }}
              value={
                0 >= options?.moderation_keys.length
                  ? undefined
                  : options?.moderation_keys.split("\n")
              }
            />
            <FormLabel>Disallowed Comment Keys</FormLabel>
            <InputMultiple
              size="medium"
              onChange={(value) => {
                setFormData({ disallowed_keys: value.join("\n") });
              }}
              value={
                0 >= options?.disallowed_keys.length
                  ? undefined
                  : options?.disallowed_keys.split("\n")
              }
            />
          </Stack>
        </Stack>
      </form>
    </Box>
  );
};
