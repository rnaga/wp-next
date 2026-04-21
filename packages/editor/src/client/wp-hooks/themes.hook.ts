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

    const wpTheme: wpUiTypes.WPTheme = {
      global: {
        ...themes.wp.global,
        zIndex: {
          layout: 100,
          mousetool: 10,
          mouse: 10,
          tool: 10,
        },
        layout: {
          backgroundColor: "rgba(50, 56, 62, 1)",
        },
        leftPanel: {
          backgroundColor: "rgba(255, 255, 255, 1)",
          borderColor: "rgba(0, 0, 0, 0.12)",
        },
        leftPanelHeader: {
          backgroundColor: "rgb(245, 245, 245)",
          borderColor: "rgba(0, 0, 0, 0.12)",
        },
        badge: {
          backgroundColor: "rgba(173, 216, 230, 1)",
        },
        mousetoolBox: {
          borderColor: "rgba(74, 79, 85, 1)",
          fontSize: 12,
          color: "rgba(255, 255, 255, 1)",
          backgroundColor: "rgba(50, 56, 62, 1)",
          hover: {
            backgroundColor: "rgba(23, 26, 28, 1)",
          },
        },
        editLayer: {
          borderColor: "rgba(74, 79, 85, 1)",
          fontSize: 12,
          color: "rgba(255, 255, 255, 1)",
          backgroundColor: "rgba(50, 56, 62, 1)",
          paddingColor: "rgba(78, 130, 251, 0.3)",
          marginColor: "rgba(248, 152, 152, 0.3)",
          hover: {
            backgroundColor: "rgba(23, 26, 28, 1)",
            borderColor: "rgb(10, 116, 246)",
          },
        },
        resizableBox: {
          backgroundColor: "rgba(0, 0, 255, 0.1)",
        },
        box: {
          borderColor: "rgba(193, 193, 193, 0.1)",
          backgroundColor: "rgba(255, 255, 255, 1)",
          hover: {
            backgroundColor: "rgba(240, 240, 240, 1)",
          },
        },
      },
      dark: {
        ...themes.wp.dark,
        zIndex: {
          layout: 100,
          mousetool: 10,
          mouse: 10,
          tool: 10,
        },
        layout: {
          backgroundColor: "rgba(50, 56, 62, 1)",
        },
        leftPanel: {
          backgroundColor: "rgba(50, 56, 62, 1)",
          borderColor: "rgba(0, 0, 0, 0.12)",
        },
        leftPanelHeader: {
          backgroundColor: "rgb(245, 245, 245)",
          borderColor: "rgba(0, 0, 0, 0.12)",
        },
        badge: {
          backgroundColor: "rgba(173, 216, 230, 1)",
        },
        mousetoolBox: {
          borderColor: "rgba(74, 79, 85, 1)",
          fontSize: 12,
          color: "rgba(255, 255, 255, 1)",
          backgroundColor: "rgba(50, 56, 62, 1)",
          hover: {
            backgroundColor: "rgba(23, 26, 28, 1)",
          },
        },
        editLayer: {
          borderColor: "rgba(74, 79, 85, 1)",
          fontSize: 12,
          color: "rgba(255, 255, 255, 1)",
          backgroundColor: "rgba(50, 56, 62, 1)",
          paddingColor: "rgba(78, 130, 251, 0.5)",
          marginColor: "rgba(248, 152, 152, 0.5)",
          hover: {
            backgroundColor: "rgba(23, 26, 28, 1)",
            borderColor: "rgb(10, 116, 246)",
          },
        },
        resizableBox: {
          backgroundColor: "rgba(0, 0, 255, 0.1)",
        },
        box: {
          borderColor: "rgba(193, 193, 193, 0.1)",
          backgroundColor: "rgba(255, 255, 255, 1)",
          hover: {
            backgroundColor: "rgba(240, 240, 240, 1)",
          },
        },
      },
    };

    // const muiTheme: (typeof themes.mui)[0] = {
    //   zIndex: {
    //     layout: 100,
    //     mousetool: 10,
    //   },
    // };

    return {
      ...themes,
      mui: themes.mui, //[muiTheme, ...themes.mui],
      wp: wpTheme,
    };
  }
}
