import { useEffect, useState } from "react";
import { z } from "zod";

import { Box, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { FormControl, FormLabel } from "@rnaga/wp-next-ui/Form";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { IconButtonDelete } from "@rnaga/wp-next-ui/IconButtonDelete";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";
import {
  SelectMultiple,
  SelectMultipleItem,
} from "@rnaga/wp-next-ui/SelectMultiple";

import * as types from "../../../../types";
import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Edit = () => {
  const { overlay } = useWPAdmin();
  const { actions, safeParse, parse } = useServerActions();
  const { searchParams, gotoPath } = useAdminNavigation();

  const { setFormData, formData, submit } =
    useFormData<types.client.formdata.BlogUpdate>("blog");
  const { setFormData: setFormDataSettings, formData: formDataSettings } =
    useFormData<types.client.formdata.SettingsUpdate>("settings");

  const [blog, setBlog] = useState<wpCoreTypes.actions.Blog>();
  const [state, setState] = useState({
    protocol: "https:",
    homePathname: "/",
    isMainBlog: false,
  });

  const validAttributeKeys = [
    "public",
    "archived",
    "spam",
    "mature",
    "deleted",
  ];
  const [attributeKeys, setAttributeKeys] = useState(validAttributeKeys);
  const [attributes, setAttributes] = useState<typeof validAttributeKeys>();

  const blogId = z
    .string()
    .transform((v) => parseInt(v))
    .parse(searchParams.get("id"));

  useEffect(() => {
    overlay.circular.promise(actions.blog.get(blogId)).then((response) => {
      const [blog] = parse(response);
      setBlog(blog);

      const { is_main_blog, url, blogname, settings, ...formData } = blog;
      if (!blog || !formData || !settings) {
        return;
      }

      setFormData(formData);
      setFormDataSettings(settings);

      setState({
        protocol: parseUrl(settings.url).protocol,
        homePathname: parseUrl(settings.home).pathname,
        isMainBlog: blog.is_main_blog ?? false,
      });

      if (blog.is_main_blog) {
        setAttributeKeys(["public", "mature"]);
      }

      const newAttributes: typeof attributes = [];
      Object.entries(formData).forEach(([key, value]) => {
        console.log(key, value);
        if (validAttributeKeys.includes(key) && value === 1) {
          newAttributes.push(key);
        }
      });
      setAttributes(newAttributes);
    });
  }, [blogId]);

  const handleChangeAttributes = (items: SelectMultipleItem[]) => {
    const keyExists = (key: string) => {
      return items.some((item) => item.id === key);
    };

    setFormData({
      public: keyExists("public") ? 1 : 0,
      mature: keyExists("mature") ? 1 : 0,
      archived: keyExists("archived") ? 1 : 0,
      spam: keyExists("spam") ? 1 : 0,
      deleted: keyExists("deleted") ? 1 : 0,
    });

    const newAttributes: typeof attributes = [];
    validAttributeKeys.forEach((key) => {
      if (keyExists(key)) {
        newAttributes.push(key);
      }
    });
    setAttributes(newAttributes);
  };

  const handleChangeState = <T extends keyof typeof state>(
    keyValue: Partial<Record<T, (typeof state)[T]>>
  ) => {
    setState({ ...state, ...keyValue });
  };

  const handleSubmit = async (data: typeof formData) => {
    const home = `${state.protocol}//${formData.domain}${state.homePathname}`;
    const url = `${state.protocol}//${formData.domain}${formData.path}`;

    const settings = { ...formDataSettings, home, url };

    const result = await overlay.circular.promise(
      actions.blog.update(blogId, data, { settings }).then(safeParse)
    );

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }
  };

  const handleDelete = () => {
    overlay.confirm.open(
      "This action cannot be undone. This will permanently delete the blog.",
      async (confirm) => {
        if (!confirm) {
          return;
        }

        const result = await overlay.circular.promise(
          actions.blog.del(blogId).then(safeParse)
        );

        if (!result.success) {
          overlay.snackbar.open("error", result.error);
          return;
        }

        gotoPath("/blogs", { segment: "site" });
      }
    );
  };

  const parseUrl = (url?: string) => {
    return new URL(url ?? "");
  };

  if (!blog || !formData) {
    return null;
  }

  return (
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
        {!state.isMainBlog && (
          <IconButtonDelete title="Delete Site" onClick={handleDelete} />
        )}
      </Box>
      <Stack spacing={2}>
        <FormControl>
          <FormLabel>Site Address (URL)</FormLabel>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "minmax(auto, 110px) 1fr",
            }}
          >
            <Select
              disabled={blog.is_main_blog}
              size="medium"
              enum={[
                { label: "HTTP", value: "http:" },
                { label: "HTTPS", value: "https:" },
              ]}
              value={state.protocol}
              onChange={(value) => handleChangeState({ protocol: value })}
            />
            <Input
              size="medium"
              key={`${formData.domain}${formData.path}`}
              value={`${formData.domain}${formData.path}`}
              disabled
            />
          </Box>
        </FormControl>
        <Box>
          <FormLabel>Home</FormLabel>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: "1fr 1fr",
            }}
          >
            <Input
              size="medium"
              key={`${state.protocol}${formData.domain}`}
              value={`${state.protocol}//${formData.domain}`}
              disabled
            />
            <Input
              size="medium"
              key={`${formDataSettings.home}`}
              value={state.homePathname || "/"}
              disabled={blog.is_main_blog}
              onChange={(value) => handleChangeState({ homePathname: value })}
            />
          </Box>
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: "repeat(2, 1fr)",
          }}
        >
          <FormControl>
            <FormLabel required>Domain</FormLabel>
            <Input
              size="medium"
              name="domain"
              required
              value={formData.domain}
              disabled={blog.is_main_blog}
            ></Input>
          </FormControl>
          <FormControl>
            <FormLabel required>Path</FormLabel>
            <Input
              size="medium"
              name="path"
              required
              value={formData.path}
              disabled={blog.is_main_blog}
            ></Input>
          </FormControl>
        </Box>

        <FormControl>
          <FormLabel>Attributes</FormLabel>
          <SelectMultiple
            size="medium"
            items={validAttributeKeys.map((key) => ({
              label: key,
              id: key,
            }))}
            value={attributes}
            onChange={(items) => {
              handleChangeAttributes(items);
            }}
            limitTags={5}
          />
        </FormControl>
        <FormControl>
          <FormLabel required>Blog Name</FormLabel>
          <Input
            size="medium"
            required
            value={formDataSettings.title}
            onChange={(value) => setFormDataSettings({ title: value })}
          ></Input>
        </FormControl>
        <FormControl>
          <FormLabel required>Admin Email</FormLabel>
          <Input
            size="medium"
            required
            value={formDataSettings.email}
            onChange={(value) => setFormDataSettings({ email: value })}
          ></Input>
        </FormControl>
        <FormControl>
          <FormLabel>Blog Description</FormLabel>
          <Input
            size="medium"
            multiline
            value={formDataSettings.description}
            minRows={3}
            onChange={(value) => setFormDataSettings({ description: value })}
          />
        </FormControl>
      </Stack>
    </form>
  );
};
