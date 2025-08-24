export {};
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

declare module "@rnaga/wp-next-core/types/client" {
  export interface GlobalState {
    "media-target-item"?: {
      post?: wpCoreTypes.actions.Posts[number];
    };
    "media-upload"?: {
      open: boolean;
    };
    "media-selector-modal"?:
      | {
          open: true;
          onSelected: (post: wpCoreTypes.actions.Posts[number]) => void;
          mimeTypes?: string[];
        }
      | {
          open: false;
          onSelected: undefined;
          mimeTypes: undefined;
        };
    "media-selector-preview"?: {
      open: boolean;
    };
  }
}
