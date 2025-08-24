import { useContext } from "react";

import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import { AdminLink } from "../../../../../components/utils/link";
import { useAdminNavigation } from "../../../../../hooks/use-admin-navigation";
import { useAdminUser } from "../../../../../hooks/use-admin-user";
import { useWPAdmin } from "../../../../../wp-admin";
import { RoleEditContext } from "./context";

import type * as types from "../../../../../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const ActionLink = (props: {
  blog: wpCoreTypes.actions.RoleEditableBlogs[number];
  blogIndex: number;
}) => {
  const { blog, blogIndex } = props;
  const { overlay, site } = useWPAdmin();
  const { adminUser: currentUser } = useAdminUser();
  const { actions, parse } = useServerActions();
  const { refresh } = useAdminNavigation();

  const { userId, setSelectedBlogIndex } = useContext(RoleEditContext);

  const availableSites = currentUser.availableSites;

  const currentBlog = !site.isMultiSite
    ? availableSites.primary_blog
    : availableSites.sites
        ?.flatMap((site) => site.blogs)
        .find((currentBlog) => currentBlog?.blog_id == blog?.blog_id);

  const handleEdit = (index: number) => () => {
    setSelectedBlogIndex(index);
  };

  const handleSuperAdminRole =
    (blog: wpCoreTypes.actions.RoleEditableBlogs[number], remove: boolean) =>
    () => {
      if (!userId) {
        return;
      }

      overlay.confirm.open(
        <>
          You are about to {remove ? "remove" : "grant"}{" "}
          <Typography bold size="large" component="span">
            Super Admin
          </Typography>{" "}
          access to{" "}
          <Typography bold size="large" component="span">
            {blog.blogname}
          </Typography>
        </>,
        async (confirm) => {
          if (!confirm) {
            return;
          }

          await overlay.circular.promise(
            actions.user
              .updateSuperAdmin(userId, {
                blogId: blog.blog_id,
                remove,
              })
              .then(parse)
          );

          //refreshRoleTab();
          refresh(["content"]);
        }
      );
    };

  const handleRemoveRoles =
    (blog: wpCoreTypes.actions.RoleEditableBlogs[number]) => async () => {
      if (!blog.blog_id || !userId) {
        return;
      }

      await overlay.circular.promise(
        actions.user
          .updateRole(userId, [], { blogId: blog.blog_id })
          .then(parse)
      );

      //refreshRoleTab();
      refresh(["content"]);
    };

  const hasRoles = (roleNames?: string[]) =>
    roleNames && roleNames.some((roleName) => roleName !== "superadmin");

  const hasSuperAdminRole = (roleNames?: string[]) =>
    roleNames && roleNames.some((roleName) => roleName == "superadmin");

  // In multisite, user can't edit own role except superadmin
  if (
    site.isMultiSite &&
    currentUser.ID == userId &&
    !currentBlog?.rolenames?.includes("superadmin")
  ) {
    return null;
  }

  return (
    <Typography>
      <AdminLink onClick={handleEdit(blogIndex)}>Edit</AdminLink>{" "}
      {hasRoles(blog.rolenames) && (
        <AdminLink color="error" onClick={handleRemoveRoles(blog)}>
          Remove Roles
        </AdminLink>
      )}{" "}
      {currentBlog?.rolenames?.includes("superadmin") && (
        <>
          {" "}
          {hasSuperAdminRole(blog.rolenames) ? (
            <AdminLink color="error" onClick={handleSuperAdminRole(blog, true)}>
              Remove Super Admin
            </AdminLink>
          ) : (
            <AdminLink onClick={handleSuperAdminRole(blog, false)}>
              Grant Super Admin
            </AdminLink>
          )}
        </>
      )}
    </Typography>
  );
};
