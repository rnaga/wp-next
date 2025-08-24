import { createContext, Dispatch, SetStateAction } from "react";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const RoleEditContext = createContext<{
  userId: number;
  targetBlogs?: wpCoreTypes.actions.RoleEditableBlogs;
  selectedBlogIndex: number | undefined;
  setSelectedBlogIndex: Dispatch<SetStateAction<number | undefined>>;
}>({} as any);
