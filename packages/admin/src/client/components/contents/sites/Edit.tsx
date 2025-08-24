import { useEffect, useState } from "react";
import { z } from "zod";

import { Box, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Checkbox } from "@rnaga/wp-next-ui/Checkbox";
import { FormControl, FormLabel } from "@rnaga/wp-next-ui/Form";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { IconButtonDelete } from "@rnaga/wp-next-ui/IconButtonDelete";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { Select } from "@rnaga/wp-next-ui/Select";

import * as types from "../../../../types";
import { useAdminNavigation, useSites } from "../../../hooks";
import { useWPAdmin } from "../../../wp-admin";

export const Edit = () => {
  const wpContext = useWPAdmin();
  const {
    wp: { error },
    overlay,
  } = wpContext;
  const { formData, setFormData, submit } =
    useFormData<types.client.formdata.SiteUpdate>("site");
  const { actions, execute, parse, safeParse, loading } = useServerActions();
  const { searchParams, refresh, goto, resolvePath } = useAdminNavigation();

  const { sites: availableSites } = useSites();
  const [site, setSite] = useState<wpCoreTypes.actions.Site>();

  const siteMetaKeys = [
    "site_name",
    "admin_email",
    "illegal_names",
    "limited_email_domains",
    "banned_email_domains",
    "add_new_users",
    "registration",
  ];

  const siteId = z
    .string()
    .transform((v) => parseInt(v))
    .parse(searchParams.get("id"));

  useEffect(() => {
    if (
      !availableSites.sites?.some(
        (site) => site.site_id == siteId && site.is_superadmin
      )
    ) {
      error.throw("Not permitted");
      return;
    }

    execute(actions.site.get(siteId)).then((response) => {
      const [data] = parse(response);
      setSite(data);
      setFormData({
        ...data,
        meta_input: siteMetaKeys.reduce((acc: Record<string, any>, key) => {
          acc[key] = data.site_meta?.[key];
          return acc;
        }, {}),
      });
    });
  }, [siteId]);

  const handleFormMetaChange = (key: string, value: any) => {
    console.log("handleFormMetaChange", key, value);
    setFormData({
      ...formData,
      meta_input: {
        ...formData.meta_input,
        [key]: value,
      },
    });
  };

  const handleSubmit = async (data: typeof formData) => {
    console.log("data", data);
    const result = await execute(actions.site.update(siteId, data)).then(
      safeParse
    );

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    refresh(["main"]);
  };

  const handleDelete = () => {
    goto(
      resolvePath("site", {
        append: "/sites/delete",
        queryParams: { id: siteId },
      })
    );
  };

  const validateDomain = (value: string): [true] | [false, string] => {
    return /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/.test(
      value
    )
      ? [true]
      : [false, "Invalid domain"];
  };

  const validateName = (value: string): [true] | [false, string] => {
    return /^([a-z0-9]+)/.test(value)
      ? [true]
      : [false, "Value can only contain lowercase letters (a-z) and numbers"];
  };

  useEffect(() => {
    console.log("Edit useEffect", formData);
  }, [formData]);

  if (!site) {
    return null;
  }

  return (
    <Loading loading={loading}>
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
          {siteId > 1 && (
            <IconButtonDelete title="Delete Site" onClick={handleDelete} />
          )}
        </Box>

        <Stack spacing={2} sx={{ rowGap: 1, display: "flex" }}>
          <FormControl>
            <FormLabel>Site Name</FormLabel>
            <Input
              size="medium"
              value={formData.meta_input?.["site_name"]}
              placeholder="Site Name"
              onChange={(value) => handleFormMetaChange("site_name", value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Site Admin Email</FormLabel>
            <Input
              size="medium"
              value={formData.meta_input?.["admin_email"]}
              placeholder="Site Admin Email"
              onChange={(value) => handleFormMetaChange("admin_email", value)}
            />
          </FormControl>
          <Box
            sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}
          >
            <FormControl>
              <FormLabel>Domain</FormLabel>
              <Input size="medium" value={site.domain} />
            </FormControl>
            <FormControl>
              <FormLabel>Path</FormLabel>
              <Input size="medium" name="path" value={site.path} />
            </FormControl>
          </Box>
          <FormControl>
            <FormLabel>Add New Users</FormLabel>
            <Checkbox
              size="medium"
              defaultChecked={site.site_meta.add_new_users == "1"}
              onChange={(e: any) => {
                console.log(e.target.checked);
                handleFormMetaChange("add_new_users", e.target.checked ? 1 : 0);
              }}
              label="Allow administrators to add new users"
            />
          </FormControl>
          <FormControl>
            <FormLabel>Allow new registrations</FormLabel>
            <Select
              size="medium"
              value={formData.meta_input?.["registration"] || "none"}
              onChange={(value) => handleFormMetaChange("registration", value)}
              enum={[
                { value: "none", label: "Registration is disabled" },
                { value: "user", label: "User accounts may be registered" },
                {
                  value: "blog",
                  label: "Logged in users may register new sites",
                },
                {
                  value: "all",
                  label: "Both sites and user accounts can be registered",
                },
              ]}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Banned Names</FormLabel>

            <InputMultiple
              onChange={(value) => handleFormMetaChange("illegal_names", value)}
              validate={validateName}
              value={formData.meta_input?.["illegal_names"] || []}
              limitTags={15}
            />
          </FormControl>
          <Box
            sx={{ display: "grid", gap: 1.5, gridTemplateColumns: "1fr 1fr" }}
          >
            <FormControl>
              <FormLabel>Limited Email Registrations</FormLabel>
              <InputMultiple
                size="medium"
                onChange={(value) => {
                  console.log("value", value);
                  handleFormMetaChange("limited_email_domains", value);
                }}
                value={formData.meta_input?.["limited_email_domains"] || []}
                validate={validateDomain}
                limitTags={5}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Banned Email Domains</FormLabel>
              <InputMultiple
                size="medium"
                onChange={(value) => {
                  handleFormMetaChange("banned_email_domains", value);
                }}
                value={formData.meta_input?.["banned_email_domains"] || []}
                validate={validateDomain}
                limitTags={5}
              />
            </FormControl>
          </Box>
        </Stack>
      </form>
    </Loading>
  );
};
