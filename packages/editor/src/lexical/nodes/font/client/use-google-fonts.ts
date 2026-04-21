import { COMMAND_PRIORITY_HIGH } from "lexical";
import { useEffect, useMemo, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { EDITOR_JSON_PARSED_COMMAND } from "../../../commands";
import { END_PROCESS_ALL_WIDGET } from "../../widget/WidgetNode";
import { NODE_GOOGLE_FONT_UPDATED } from "../commands";
import {
  buildGoogleFontsStyleLink,
  getGoogleFonts,
  mergeGoogleFonts,
} from "../GoogleFontNode";
import { GoogleFonts } from "../../../../types";

export const useGoogleFonts = () => {
  const [editor] = useLexicalComposerContext();

  const [fonts, setFonts] = useState<GoogleFonts>();
  const [widgetFonts, setWidgetFonts] = useState<GoogleFonts>();

  const [styleLink, setStyleLink] = useState<string | null>(null);

  const [styleLinkElement, setStyleLinkElement] =
    useState<HTMLLinkElement | null>(null);

  const allFonts = useMemo(
    () => mergeGoogleFonts(fonts, widgetFonts),
    [fonts, widgetFonts]
  );

  useEffect(() => {
    const removeCommands: ReturnType<typeof editor.registerCommand>[] = [];
    for (const command of [
      EDITOR_JSON_PARSED_COMMAND,
      NODE_GOOGLE_FONT_UPDATED,
    ]) {
      removeCommands.push(
        editor.registerCommand(
          command,
          () => {
            const fonts = getGoogleFonts(editor);
            setFonts(fonts);
            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      );
    }

    return () => {
      for (const removeCommand of removeCommands) {
        removeCommand();
      }
    };
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      // Triggered when widget is processed
      END_PROCESS_ALL_WIDGET,
      ({ nestedEditors }) => {
        const fonts = getGoogleFonts(nestedEditors);
        setWidgetFonts(fonts);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  // Google style link
  useEffect(() => {
    const styleLink = buildGoogleFontsStyleLink(allFonts);
    setStyleLink(styleLink);
  }, [allFonts]);

  useEffect(() => {
    if (!styleLink) {
      return;
    }

    const link: HTMLLinkElement =
      document.querySelector("#__google-font-style-link") ??
      document.createElement("link");

    link.rel = "stylesheet";
    link.href = styleLink;
    link.id = "__google-font-style-link";

    setStyleLinkElement(link);
  }, [styleLink]);

  return {
    fonts: allFonts,
    link: styleLink,
    element: styleLinkElement,
  };
};
