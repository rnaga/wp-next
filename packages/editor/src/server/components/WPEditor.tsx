import { AuthError } from "@rnaga/wp-next-core/client/components/auth";
import { WP } from "@rnaga/wp-next-core/server/wp";

import { checkPermission } from "../actions/check-permission";
import WPPage from "./WPPage";
import WPPreview from "./WPPreview";
import { WrapperLayout } from "../../client/layout/WrapperLayout";

export const WP_EDITOR_ADMIN_PAGE_SEGMENTS = [
  "editor",
  "preview",
  "full-preview",
] as const;

export type WPEditorAdminPageSegment =
  (typeof WP_EDITOR_ADMIN_PAGE_SEGMENTS)[number];

export const isWPEditorAdminPageSegment = (
  segment: string
): segment is WPEditorAdminPageSegment => {
  return WP_EDITOR_ADMIN_PAGE_SEGMENTS.includes(
    segment as WPEditorAdminPageSegment
  );
};

async function FullPreviewPage(props: {
  params: Promise<{ paths: string[] }>;
  searchParams?: Promise<
    {
      id: string;
      slug?: string;
      previewInfoKey?: string;
    } & Record<string, string>
  >;
}) {
  // e.g. Path  /1/full-preview/rest => paths: ["1", "full-preview", "rest"]
  const [, , ...restPaths] = (await props.params).paths;
  const searchParams = await props.searchParams;

  const { id, slug, previewInfoKey, ...restSearchParams } = searchParams || {};

  // Use slug for reserved pages like 404 (not-found), which are only triggered
  // implicitly (e.g. when no route matches) and are never accessible via their slug
  // on the public route (src/app/(public)/[templateSlug]/page.tsx).
  // Passing ?slug=not-found through the admin route is the only way to preview them explicitly.
  if (slug) {
    return <WPPage idOrSlug={slug} />;
  }

  if (!id || !previewInfoKey) {
    return <div>Invalid ID or previewInfoKey</div>;
  }

  return (
    <WPPage
      idOrSlug={slug ? slug : parseInt(id!)}
      searchParams={restSearchParams}
      params={restPaths}
      previewInfoKey={previewInfoKey}
    />
  );
}

export const WPEditor = async (props: {
  segment: WPEditorAdminPageSegment;
  params: Promise<{ paths: string[] }>;
  searchParams?: Promise<
    { id: string; slug?: string; previewInfoKey?: string } & Record<
      string,
      string
    >
  >;
}) => {
  const { segment, params, searchParams } = props;
  const wp = await WP();

  if (wp.config.isMultiSite()) {
    const userId = wp.current.user?.props?.ID;

    if (!userId) {
      return (
        <AuthError
          error="User not found. Please login with a different account."
          showLogoutLink={true}
        />
      );
    }

    const blogs = await wp.utils.user.getBlogs(userId);
    if (0 >= blogs.length) {
      return (
        <AuthError
          error="You are not allowed to access this page. Logout and login again if you think this is a mistake."
          showLogoutLink={true}
        />
      );
    }

    // Check if blog Id is the same as default blog Id, throw AuthError if not
    // Note: currently editor page is only available for default blog in multisite mode.
    const defaultBlogId = wp.config.config.multisite.defaultBlogId;
    const currentBlogId = wp.current.blogId;

    if (currentBlogId && defaultBlogId && currentBlogId !== defaultBlogId) {
      return (
        <AuthError
          error="You are not allowed to access this page. Logout and login again if you think this is a mistake."
          showLogoutLink={true}
        />
      );
    }
  }

  // Now check for user role.
  // Only the following roles are allowed to access the editor pages: superadmin(multisite), administrator, editor.
  if (!(await checkPermission())) {
    return (
      <AuthError
        error="You do not have permission to access this page. Logout and login again if you think this is a mistake."
        showLogoutLink={true}
      />
    );
  }

  switch (segment) {
    case "editor":
      return <WrapperLayout />;
    case "preview":
      return <WPPreview />;
    case "full-preview":
      return <FullPreviewPage params={params} searchParams={searchParams} />;
    default:
      return <AuthError error="Invalid segment" />;
  }
};
