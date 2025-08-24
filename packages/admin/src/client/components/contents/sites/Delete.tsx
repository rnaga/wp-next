import { useEffect, useState } from "react";
import { z } from "zod";

import {
  Alert,
  Box,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  Stack,
} from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation, useSites } from "../../../hooks";
import { useWPAdmin } from "../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
export const Delete = () => {
  const { searchParams, gotoPath } = useAdminNavigation();
  const wpContext = useWPAdmin();
  const {
    wp: { error },
    overlay,
  } = wpContext;
  const { sites: availableSites } = useSites();
  const { wpTheme } = useWPTheme();
  const { formData, setFormData, submit } = useFormData("site-delete", {
    initialValue: {
      deleteAll: true,
      newSiteId: 1,
    },
  });
  const { actions, safeParse, parse } = useServerActions();

  const [blogs, setBlogs] = useState<wpCoreTypes.actions.Blogs>();
  const [site, setSite] = useState<wpCoreTypes.actions.Site>();
  const [otherSites, setOtherSites] = useState<typeof availableSites.sites>([]);

  const siteId = z
    .string()
    .transform((v) => parseInt(v))
    .parse(searchParams.get("id"));

  useEffect(() => {
    if (1 >= siteId) {
      error.throw("Invalid site id");
      return;
    }

    if (
      !availableSites.sites?.some(
        (site) => site.site_id == siteId && site.is_superadmin
      )
    ) {
      error.throw("Not permitted");
      return;
    }

    const otherSites = availableSites.sites?.filter(
      (site) => site.site_id !== siteId
    );

    if (!otherSites) {
      return;
    }

    setOtherSites(otherSites);

    const fetchData = async () => {
      const resultBlogs = await actions.blog
        .list({
          site: [siteId],
          per_page: 999,
        })
        .then(safeParse);

      if (!resultBlogs.success) {
        error.throw(resultBlogs.error);
      }

      const resultSite = await actions.site.get(siteId).then(safeParse);
      if (!resultSite.success) {
        error.throw(resultSite.error);
      }

      return { blogs: resultBlogs.data, site: resultSite.data };
    };

    overlay.circular.promise(
      fetchData().then((data) => {
        setBlogs(data.blogs);
        setSite(data.site);
      })
    );

    setFormData({ newSiteId: otherSites[0].site_id });
  }, []);

  const handleChange = (siteId: number) => {
    const newSiteId = availableSites.sites?.filter(
      (site) => site.site_id == siteId
    )[0].site_id;

    if (!newSiteId) {
      error.throw("Unknown error - please try again");
      return;
    }

    setFormData({ deleteAll: false, newSiteId });
  };

  const handleChangeRadio = (v: string) => {
    console.log(v);
    setFormData({ deleteAll: v === "delete" });
  };

  const validate = (data: typeof formData) => {
    if (!data.deleteAll && 1 >= data.newSiteId) {
      error.throw("Invalid formData");
      return false;
    }

    return true;
  };

  const handleSubmit = () => {
    overlay.confirm.open(
      "This action cannot be undone. This will permanently delete the site.",
      async (confirm) => {
        if (!confirm) {
          return;
        }

        const serverAction = formData.deleteAll
          ? actions.site.del(siteId)
          : actions.site.del(siteId, { newSiteId: formData.newSiteId });

        await overlay.circular.promise(serverAction).then(parse);
        gotoPath("/sites");
      }
    );
  };

  const handleCancel = () => {
    gotoPath("/sites/edit", {
      queryParams: { id: siteId },
    });
  };

  if (!site) {
    return null;
  }

  return (
    <form onSubmit={submit(handleSubmit, validate)}>
      <Stack>
        <Alert variant="outlined" severity="error" sx={{ mb: 2 }}>
          <Typography component="div" size="medium" color="error" bold>
            <b>{site.site_meta?.["site_name"]}</b> will be deleted.
          </Typography>
        </Alert>

        {blogs && otherSites && (
          <>
            <Typography size="medium">
              The following blogs are associated with this site:
            </Typography>
            <List sx={{ listStyleType: "disc" }}>
              {blogs.map((blog) => (
                <ListItemText
                  key={`${blog.blog_id}`}
                  sx={{
                    display: "list-item",
                    ml: 4,
                  }}
                >
                  <Typography size="medium" bold>
                    {blog.blog_meta.blogname ?? `${blog.domain} ${blog.path}`}
                  </Typography>
                </ListItemText>
              ))}
            </List>
            <Typography>What should be done with these blogs?</Typography>
            <Box
              sx={{
                border: "1px solid",
                borderColor: wpTheme.colorScale[400],
                borderRadius: 1,
              }}
            >
              <RadioGroup
                defaultValue="delete"
                name="site"
                onChange={(e) => handleChangeRadio(e.target.value)}
              >
                <List>
                  <ListItem>
                    <Radio value="delete" />
                    <Typography size="medium">Delete all blogs.</Typography>
                  </ListItem>
                  <ListItem>
                    <Radio value="inherit" />
                    <Typography size="medium">
                      Attribute all blogs to:
                    </Typography>
                  </ListItem>
                  {formData.deleteAll === false && (
                    <ListItem sx={{ pl: 7 }}>
                      <SelectAutocomplete
                        key={siteId}
                        size="medium"
                        onChange={(value) => {
                          handleChange(parseInt(value));
                        }}
                        value={`${formData.newSiteId ?? 1}`}
                        items={otherSites.map((site) => ({
                          label: site.sitename,
                          value: `${site.site_id}`,
                        }))}
                        disableClearable
                        slotProps={{
                          input: {
                            minWidth: 250,
                          },
                        }}
                      />
                    </ListItem>
                  )}
                </List>
              </RadioGroup>
            </Box>
          </>
        )}
        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
          <Button size="medium" type="submit">
            Confirm Deletion
          </Button>
          <Button color="error" onClick={handleCancel}>
            Cancel
          </Button>
        </Box>
      </Stack>
    </form>
  );
};
