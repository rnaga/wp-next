import { useEffect, useState, useTransition } from "react";

import { Box, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { ActionTd, Table, Td, Th, THead, Tr } from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import * as wpDefaults from "@rnaga/wp-node/defaults";

import { AdminLink } from "../../../../components/utils/link";
import { useAdminNavigation, useSites } from "../../../../hooks/";
import { useWPAdmin } from "../../../../wp-admin";
import { EditModal } from "./EditModal";

import type * as wpTypes from "@rnaga/wp-node/types";
import type * as types from "../../../../../types";

export type EditState =
  | undefined
  | {
      role: wpTypes.Role | undefined;
      roleName: string | undefined;
    };

export const List = () => {
  const defaultRoleNames = Object.keys(wpDefaults.roles);
  const { site, overlay } = useWPAdmin();
  const { actions, safeParse, parse } = useServerActions();

  const { queryObject, pushRouter } = useAdminNavigation<{
    blog_id: number;
  }>();

  const {
    sites: availableSites,
    blogs: availableBlogs,
    updateSites,
  } = useSites();

  const [loading, startTransition] = useTransition();

  const [state, setState] = useState<{
    openEditModal: boolean;
    edit: EditState;
    selectedBlog: types.client.AvailableBlog | undefined;
    selectedRoleName: undefined | string;
    roleCount: Record<string, number | undefined> | undefined;
  }>({
    openEditModal: false,
    edit: undefined,
    selectedBlog: undefined,
    selectedRoleName: undefined,
    roleCount: undefined,
  });

  const blogId =
    parseInt(`${queryObject.blog_id}`) > 0
      ? parseInt(`${queryObject.blog_id}`)
      : availableSites.primary_blog?.blog_id ?? site.blogId;

  useEffect(() => {
    if (!availableBlogs || !blogId) {
      return;
    }

    const blog = !site.isMultiSite
      ? availableSites.primary_blog
      : (() => {
          const blogs = availableBlogs.filter(
            (blog) => blog?.blog_id == queryObject.blog_id
          );
          return 0 >= blogs.length ? availableBlogs[0] : blogs[0];
        })();

    startTransition(async () => {
      const [roleCount] = await actions.roles
        .count({ blog_id: blogId })
        .then(parse);

      setState({
        ...state,
        selectedBlog: blog,
        roleCount,
      });
    });
  }, [availableBlogs, queryObject.blog_id]);

  const roles = Object.entries(state?.selectedBlog?.blog_roles || {}).filter(
    ([roleName]) => !["anonymous", "superadmin"].includes(roleName)
  );

  const handleSetState = (newState: Partial<typeof state>) => () => {
    setState({ ...state, ...newState });
  };

  const handleEdit = (
    roleName: (typeof roles)[number][0],
    role: (typeof roles)[number][1]
  ) => {
    setState({
      ...state,
      openEditModal: true,
      edit: {
        role,
        roleName,
      },
    });
  };

  const handleDelete = (
    roleName: (typeof roles)[number][0],
    role: (typeof roles)[number][1]
  ) => {
    overlay.confirm.open(
      `You are about to delete the ${role.name} role. This action cannot be undone`,
      async (confirm) => {
        if (!confirm) return;

        const result = await actions.roles
          .del(roleName, { blogId })
          .then(safeParse);

        if (!result.success) {
          overlay.snackbar.open("error", result.error);
          return;
        }

        overlay.snackbar.open("success", "Role has been deleted");
        await updateSites();
      }
    );
  };

  const handleClickAddNewRole = () => {
    blogId &&
      setState({
        ...state,
        openEditModal: true,
        edit: {
          role: undefined,
          roleName: undefined,
        },
      });
  };

  const handleSelectBlog = (blogId: number) => {
    pushRouter({
      blog_id: blogId,
    });
  };

  const showBlogDropdown =
    site.isMultiSite && availableBlogs && availableBlogs?.length > 0;

  return (
    <>
      <EditModal
        open={state.openEditModal}
        editState={state.edit}
        blogId={blogId}
        onClose={handleSetState({ openEditModal: false, edit: undefined })}
      />
      {showBlogDropdown && (
        <Box sx={{ display: "flex", mb: 2 }}>
          <Select
            size="medium"
            sx={{ maxWidth: 400 }}
            enum={[
              ...availableBlogs.map((blog) => ({
                label: blog?.blogname || "Unknown",
                value: `${blog?.blog_id || 0}`,
              })),
            ]}
            value={`${blogId}`}
            onChange={(value) => {
              handleSelectBlog(parseInt(value));
            }}
          />
        </Box>
      )}
      <Loading loading={loading}>
        <Stack spacing={1}>
          <Table>
            <THead>
              <Th>Name</Th>
              <Th>Role</Th>
              <Th>Capabilities</Th>
              <Th>Users</Th>
            </THead>
            <tbody>
              {roles.map(([roleName, role]) => (
                <Tr key={role.name}>
                  {defaultRoleNames.includes(roleName) ? (
                    <Td
                      style={{
                        paddingLeft: 10,
                        paddingTop: 5,
                        paddingBottom: 5,
                      }}
                    >
                      <Typography size="medium" bold>
                        {role.name}
                      </Typography>
                    </Td>
                  ) : (
                    <ActionTd>
                      <Typography size="medium" bold>
                        {role.name}
                      </Typography>
                      <Typography>
                        <AdminLink onClick={() => handleEdit(roleName, role)}>
                          Edit
                        </AdminLink>{" "}
                        <AdminLink
                          color="error"
                          onClick={() => handleDelete(roleName, role)}
                        >
                          Delete
                        </AdminLink>
                      </Typography>
                    </ActionTd>
                  )}
                  <Td>
                    <Typography>{roleName}</Typography>
                  </Td>
                  <Td>{role.capabilities.length}</Td>
                  <Td>{state?.roleCount?.[roleName] ?? 0}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
          <Box>
            <Button size="medium" onClick={handleClickAddNewRole}>
              Add New Role
            </Button>
          </Box>
        </Stack>
      </Loading>
    </>
  );
};
