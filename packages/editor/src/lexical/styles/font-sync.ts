import { LexicalEditor } from "lexical";

import { $syncCustomFont } from "../nodes/font/CustomFontNode";
import { $syncGoogleFont } from "../nodes/font/GoogleFontNode";

export const syncCSSFont = (
  editor: LexicalEditor,
  options?: {
    discrete?: boolean;
  }
) => {
  const { discrete } = options ?? {};

  editor.update(
    () => {
      $syncGoogleFont(editor);
    },
    {
      discrete: discrete ? true : undefined,
    }
  );

  editor.update(
    () => {
      $syncCustomFont(editor);
    },
    {
      discrete: discrete ? true : undefined,
    }
  );
};
