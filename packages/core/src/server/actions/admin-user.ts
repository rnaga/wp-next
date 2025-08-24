"use server";

import { createResponsePayload } from "../../server/actions/response";
import { WP } from "../../server/wp";

export const getAdminCurrent = async () => {
  const wp = await WP();
  const user = wp.current.user;

  if (!user?.props) {
    return createResponsePayload({
      success: false,
      error: "User not logged in",
      data: undefined as never,
    });
  }

  const role = await user.role();

  if (role.is("anonymous")) {
    return createResponsePayload({
      success: false,
      error: "User not logged in",
      data: undefined as never,
    });
  }

  const blogId = wp.current.blogId;

  const availableSites = (await wp.utils.crud.user.getAvailableSites()).data;

  const blog = wp.config.isMultiSite()
    ? (availableSites.sites?.flatMap((site) => site.blogs) ?? []).find(
        (blog) => blog?.blog_id == blogId
      )
    : availableSites.primary_blog;

  if (!blog || !blog.rolenames || !blog.capabilities) {
    return createResponsePayload({
      success: false,
      error: "Invalid Blog",
      data: undefined as never,
    });
  }

  const roleNames = blog.rolenames;
  const capabilities = blog.capabilities;

  return createResponsePayload({
    success: true,
    error: undefined,
    data: {
      ...user.props,
      role: {
        names: new Set(roleNames),
        capabilities: new Set(capabilities),
      },
      availableSites,
    },
  });
};

export const getRoleEditableBlogs = async (userId: number) => {
  const wp = await WP();
  const user = wp.current.user;

  if (!user || !(await user.can("list_users"))) {
    return createResponsePayload({
      success: false,
      error: "Not permitted",
      data: undefined as never,
    });
  }

  // Get blogs associated with a user
  const blogs = await wp.utils.user.getBlogs(userId);

  const roleEditableBlogs: ((typeof blogs)[number] & {
    canEditAdminRole: boolean;
  })[] = [];

  for (const blog of blogs) {
    if (await user.can("edit_user_roles", [blog.blog_id])) {
      roleEditableBlogs.push({
        ...blog,
        canEditAdminRole: await user.can("edit_admin_roles", blog.blog_id),
      });
    }
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: roleEditableBlogs,
  });
};

export const getRoleAdditiveBlogs = async (exclusiveBlogIds: number[]) => {
  const wp = await WP();
  const user = wp.current.user;

  if (!user || !user.props?.ID || !(await user.can("list_users"))) {
    return createResponsePayload({
      success: false,
      error: "Not permitted",
      data: undefined as never,
    });
  }

  // Get blogs associated with a current user
  const blogs = await wp.utils.user.getBlogs(user.props.ID);

  const roleAdditiveBlogs: ((typeof blogs)[number] & {
    canEditAdminRole: boolean;
  })[] = [];

  for (const blog of blogs) {
    if (
      !exclusiveBlogIds.includes(blog.blog_id) &&
      (await user.can("edit_user_roles", [blog.blog_id]))
    ) {
      roleAdditiveBlogs.push({
        ...blog,
        canEditAdminRole: await user.can("edit_admin_roles", blog.blog_id),
      });
    }
  }

  return createResponsePayload({
    success: true,
    error: undefined,
    data: roleAdditiveBlogs,
  });
};
