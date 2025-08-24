import { useEffect, useState, useTransition } from "react";

import { AccordionDetails, Box } from "@mui/material";
import { Accordion, AccordionSummary } from "@rnaga/wp-next-ui/Accordion";
import {
  ActionTd,
  ListGrid,
  ListGridItem,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Viewport } from "@rnaga/wp-next-ui/Viewport";

import { useAdminServerActions } from "../../../../../hooks/use-admin-server-actions";
import { Add } from "./";
import { ActionLink } from "./ActionLink";
import { RoleEditContext } from "./context";
import { Edit } from "./Edit";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Roles = (props: { userId: number }) => {
  const { userId } = props;
  const { actions, parse } = useAdminServerActions();

  const [selectedBlogIndex, setSelectedBlogIndex] = useState<number>();
  const [blogs, setBlogs] = useState<wpCoreTypes.actions.RoleEditableBlogs>();

  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const [blogs] = await actions.adminUser
        .getRoleEditableBlogs(userId)
        .then(parse);
      setBlogs(blogs);
    });
  }, [userId]);

  const handleCancelEdit = () => {
    setSelectedBlogIndex(undefined);
  };

  if (!blogs) {
    return null;
  }

  return (
    <RoleEditContext
      value={{
        userId,
        targetBlogs: blogs,
        selectedBlogIndex,
        setSelectedBlogIndex,
      }}
    >
      <Loading loading={loading} sx={{ mb: 2 }}>
        <Box sx={{ mt: 1 }}>
          <Table>
            <THead>
              <Th>Blog Name</Th>
              <Th viewport="desktop" style={{ width: "60%" }}>
                Roles
              </Th>
            </THead>
            <tbody>
              {blogs.map((blog, index) => (
                <Tr style={{ paddingTop: "1em" }} key={`${blog.blog_id}`}>
                  <ActionTd>
                    <Viewport device="desktop">{blog?.blogname}</Viewport>
                    <Viewport device="desktop">
                      <ActionLink blog={blog} blogIndex={index} />
                    </Viewport>
                  </ActionTd>
                  <Td viewport="mobile">
                    <Accordion>
                      <AccordionSummary>{blog?.blogname}</AccordionSummary>
                      <AccordionDetails>
                        <ActionLink blog={blog} blogIndex={index} />
                        <ListGrid>
                          <ListGridItem title="Roles">
                            <Edit
                              blogId={blog.blog_id}
                              roles={blog.blog_roles}
                              show={selectedBlogIndex == index}
                              onCancelEdit={handleCancelEdit}
                            />
                            {selectedBlogIndex !== index &&
                              blog?.rolenames?.join(", ")}
                          </ListGridItem>
                        </ListGrid>
                      </AccordionDetails>
                    </Accordion>
                  </Td>
                  <Td viewport="desktop">
                    <Edit
                      blogId={blog.blog_id}
                      roles={blog.blog_roles}
                      show={selectedBlogIndex == index}
                      onCancelEdit={handleCancelEdit}
                    />

                    {selectedBlogIndex !== index && (
                      <Typography size="medium">
                        {blog?.rolenames?.join(", ")}
                      </Typography>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Box>
        <Box sx={{ display: "flex", gap: 1, mt: 1, alignItems: "center" }}>
          <Add blogs={blogs} />
        </Box>
      </Loading>
    </RoleEditContext>
  );
};
