import { createCommand } from "lexical";
import { GoogleFontNode } from "./GoogleFontNode";
import { CustomFontNode } from "./CustomFontNode";

export const NODE_GOOGLE_FONT_UPDATED = createCommand<{
  node: GoogleFontNode;
}>();

export const NODE_CUSTOM_FONT_UPDATED = createCommand<{
  node: CustomFontNode;
}>();

// export const NODE_CUSTOM_FONT_UPDATED = createCommand<{
//   node: FontNode;
// }>();
