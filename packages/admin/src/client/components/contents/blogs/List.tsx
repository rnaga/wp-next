import { useEffect, useState, useTransition } from "react";
import { z } from "zod";

import { AccordionDetails, Box } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Accordion } from "@rnaga/wp-next-ui/Accordion";
import {
  ActionTd,
  ListGrid,
  ListGridItem,
  ListGridTitle,
  SortableTh,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { Admin } from "../";
import { SelectWPSite } from "../../../components/utils/dropdown/SelectWPSite";
import { AdminLink } from "../../../components/utils/link";
import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useSites } from "../../../hooks/use-sites";
import { useWPAdmin } from "../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
export const List = () => {
  const {
    site,
    wp: { viewport },
  } = useWPAdmin();
  const { navigationStatus, queryObject, searchParams, pushRouter } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"blog">>();
  const { sites: availableSites } = useSites();
  const { actions, parse } = useServerActions();

  const [loading, startTransaction] = useTransition();
  const [blogs, setBlogs] = useState<wpCoreTypes.actions.Blogs>();

  const siteId = searchParams.get("site_id")
    ? z
        .string()
        .transform((v) => parseInt(v))
        .parse(searchParams.get("site_id"))
    : site.siteId;

  useEffect(() => {
    startTransaction(() => {
      actions.blog
        .list({
          ...queryObject,
          site_id: queryObject?.site_id ?? siteId,
          per_page: 999,
        })
        .then((response) => {
          const [blogs] = parse(response);
          setBlogs(blogs);
        });
    });
  }, [siteId, navigationStatus]);

  const canEditBlog = (blogId: number) => {
    return availableSites.sites
      ?.flatMap((site) => site.blogs)
      .some(
        (blog) =>
          blog?.blog_id == blogId && blog.capabilities.includes("manage_sites")
      );
  };

  const handleOnClick = (siteId: number, sitename: string) => {
    pushRouter({
      site_id: siteId,
    });
  };

  if (!blogs) {
    return null;
  }

  return (
    <>
      <Box sx={{ my: 2, maxWidth: viewport.isDesktop ? "30%" : "100%" }}>
        <SelectWPSite size="medium" onChange={handleOnClick} />
      </Box>
      <Loading loading={loading}>
        <Table>
          <THead>
            <SortableTh name="Name" orderby="blog_id" />
            <SortableTh name="URL" orderby="url" viewport="desktop" />
            <SortableTh
              name="Last Updated"
              orderby="last_updated"
              viewport="desktop"
            />
          </THead>
          <tbody>
            {blogs?.map((blog) => (
              <Tr style={{ paddingTop: "1em" }} key={`${blog.blog_id}`}>
                <ActionTd>
                  <Typography size="medium" bold>
                    {blog.blogname}
                  </Typography>
                  {canEditBlog(blog.blog_id) && (
                    <AdminLink
                      subPage="edit"
                      queryParams={{ id: blog.blog_id }}
                    >
                      Edit
                    </AdminLink>
                  )}
                </ActionTd>
                <Td viewport="mobile">
                  <Accordion>
                    <ListGridTitle title={blog.blogname} />
                    <AccordionDetails>
                      {canEditBlog(blog.blog_id) && (
                        <AdminLink
                          subPage="edit"
                          queryParams={{ id: blog.blog_id }}
                        >
                          Edit
                        </AdminLink>
                      )}
                      <ListGrid>
                        <ListGridItem title="URL">{blog.url}</ListGridItem>
                        <ListGridItem title="Last Updated">
                          {blog.last_updated?.toString()}
                        </ListGridItem>
                      </ListGrid>
                    </AccordionDetails>
                  </Accordion>
                </Td>
                <Td viewport="desktop">{blog.url}</Td>
                <Td viewport="desktop">{blog.last_updated?.toString()}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Loading>
    </>
  );
};
