//// <reference types="../../../../ui/src/types/hooks/filters.d.ts" />

import { filter as clientFilter } from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import type * as wpUiTypes from "@rnaga/wp-next-ui/types";

@hook("editor-themes")
export class ThemesHook {
  @clientFilter("next_ui_theme")
  hookFilter(...args: Parameters<wpCoreTypes.hooks.Filters["next_ui_theme"]>) {
    const [themes] = args;

    return {
      ...themes,
      mui: themes.mui,
      wp: themes.wp,
    };
  }
}
