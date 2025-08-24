"use client";

import { Admin } from "../../client/components/contents";
import { CommentModal } from "../../client/components/utils/modal";
import { filter as clientFilter } from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { MediaSelectorModal } from "@rnaga/wp-next-ui/media-selector";

/**
 * PreloadModalHook
 *
 * This hook adds the modals to the admin during preload.
 */
@hook("next_admin_preload_modal")
export class PreloadModalHook {
  @clientFilter("next_admin_preload_modal")
  hookFilter(
    ...args: Parameters<wpCoreTypes.hooks.Filters["next_admin_preload_modal"]>
  ) {
    const [modals] = args;

    return [
      ...modals,
      <Admin.Users.Create key={1} />,
      <Admin.Sites.Create key={2} />,
      <Admin.Blogs.Create key={3} />,
      <Admin.Media.Edit key={4} />,
      <CommentModal key={5} />,
      <MediaSelectorModal key={6} />,
    ];
  }
}
