import { useEffect, useState } from "react";

import HomeIcon from "@mui/icons-material/Home";
import { Box, SxProps } from "@mui/material";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useAdminUser } from "../../../hooks/use-admin-user";
import { useWPAdmin } from "../../../wp-admin";
import { Select } from "@rnaga/wp-next-ui/Select";

export const SelectWPAvailableSite = (props: {
  onClick: (siteId?: number, blogId?: number) => any;
  capabilities?: string[];
  sx?: SxProps;
}) => {
  const { onClick, capabilities, sx } = props;
  const { site } = useWPAdmin();
  const { adminUser } = useAdminUser();

  const { queryObject } = useAdminNavigation();

  type List = {
    name: string;
    site_id?: number;
    blog_id?: number;
    isSite: boolean;
  }[];
  const [siteList, setSiteList] = useState<List>();

  useEffect(() => {
    if (!adminUser.availableSites || !site.isMultiSite) {
      return;
    }

    const siteList: List = [];
    for (const site of adminUser.availableSites?.sites ?? []) {
      site.is_superadmin &&
        siteList.push({
          name: site.sitename,
          site_id: site.site_id,
          isSite: true,
        });
      if (site.blogs && site.blogs?.length > 0) {
        for (const blog of site.blogs ?? []) {
          if (!blog.blog_id) {
            continue;
          }

          if (
            capabilities &&
            !capabilities.some((v) => blog.capabilities.includes(v))
          ) {
            continue;
          }

          const name =
            blog.blogname && blog.blogname.length > 0
              ? blog.blogname
              : `Blog Name Not Provided (blogId: ${blog.blog_id})`;
          siteList.push({
            name,
            blog_id: blog.blog_id,
            isSite: false,
          });
        }
      }
    }

    setSiteList(siteList);
  }, [adminUser.availableSites]);

  return (
    siteList && (
      <Select
        size="medium"
        label="Site / Blog"
        value={`${queryObject?.site_id}${queryObject?.blog_id ?? site.blogId}`}
        sx={{ minWidth: 200, ...sx }}
        onChange={(value) => {
          const [siteId, blogId] = value.split(",").map((v) => parseInt(v));
          onClick(siteId || undefined, blogId || undefined);
        }}
        enum={[
          ...siteList.map((site) => ({
            value: `${site.site_id ?? ""},${site.blog_id ?? ""}`,
            label: (
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1 }}
                component={"span"}
              >
                {site.isSite && <HomeIcon />} {site.name}
              </Box>
            ) as any,
          })),
        ]}
      />
    )
  );
};
