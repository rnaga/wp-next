import { Box } from "@mui/material";
import { useState, useEffect, useMemo } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { StyleClassSelector } from "./style/StyleClassSelector";
import { StyleLayout } from "./style/layout/StyleLayout";
import { StyleSize } from "./style/StyleSize";
import { StyleSpacing } from "./style/spacing/StyleSpacing";
import { StylePosition } from "./style/position/StylePosition";
import { Accordions } from "@rnaga/wp-next-ui/Accordions";
import { StyleFormContext } from "./style/StyleFormContext";
import { StyleTypography } from "./style/typography/StyleTypography";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { StyleBackground } from "./style/background/StyleBackground";
import { StyleBoxSurface } from "./style/box-surface/StyleBoxSurface";
import { StyleTransform } from "./style/transform/StyleTransform";
import { StyleTransitions } from "./style/transition/StyleTransitions";
import { StyleFlexChild } from "./style/layout/StyleFlexChild";
import { StyleGridChild } from "./style/layout/StyleGridChild";
import { useSelectedNode } from "../global-event";
import { WPLexicalNode } from "../../lexical/nodes/wp";
import { StyleCustomProperties } from "./style/custom-properties/StyleCustomProperties";

export type StyleFormContentKey =
  | "classSelectors"
  | "customProperties"
  | "transitions"
  | "flexChild"
  | "gridChild"
  | "layout"
  | "spacing"
  | "size"
  | "position"
  | "transform"
  | "typography"
  | "background"
  | "boxSurface";

type AccordionItem = {
  key: StyleFormContentKey;
  title: string;
  content: React.JSX.Element;
  //content: React.ReactNode;
  condition?: boolean;
};

export type StyleFormProps = {
  includeOnly?: StyleFormContentKey[];
  exclude?: StyleFormContentKey[];
};

export const createStyleForm = (options: StyleFormProps) => {
  return () => <StyleForm {...options} />;
};

export const StyleForm = ({ includeOnly, exclude }: StyleFormProps = {}) => {
  const { wpTheme } = useWPTheme();
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [parentDisplay, setParentDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedNode) {
      setParentDisplay(null);
      return;
    }

    const parentNode = editor.read(() =>
      selectedNode.getParent()
    ) as WPLexicalNode;
    if (!parentNode) {
      setParentDisplay(null);
      return;
    }

    const parentStyles = parentNode?.__css?.get();
    setParentDisplay(parentStyles?.__layout?.display);
  }, [selectedNode, editor]);

  const isParentFlex =
    parentDisplay === "flex" || parentDisplay === "inline-flex";
  const isParentGrid =
    parentDisplay === "grid" || parentDisplay === "inline-grid";

  const accordionItems = useMemo(() => {
    const allItems: AccordionItem[] = [
      {
        key: "classSelectors",
        title: "Class Selectors",
        content: <StyleClassSelector />,
      },
      {
        key: "customProperties",
        title: "Custom Properties",
        content: <StyleCustomProperties />,
      },
      {
        key: "flexChild",
        title: "Flex Child",
        content: <StyleFlexChild />,
        condition: isParentFlex,
      },
      {
        key: "gridChild",
        title: "Grid Child",
        content: <StyleGridChild />,
        condition: isParentGrid,
      },
      { key: "layout", title: "Layout", content: <StyleLayout /> },
      { key: "spacing", title: "Spacing", content: <StyleSpacing /> },
      { key: "size", title: "Size", content: <StyleSize /> },
      { key: "position", title: "Position", content: <StylePosition /> },
      { key: "transform", title: "Transform", content: <StyleTransform /> },
      { key: "typography", title: "Typography", content: <StyleTypography /> },
      { key: "background", title: "Background", content: <StyleBackground /> },
      { key: "boxSurface", title: "Box Surface", content: <StyleBoxSurface /> },
      {
        key: "transitions",
        title: "Transitions",
        content: <StyleTransitions />,
      },
    ];

    return allItems
      .filter((item) => item.condition !== false)
      .filter((item) => !includeOnly || includeOnly.includes(item.key))
      .filter((item) => !exclude || !exclude.includes(item.key))
      .map(({ title, content }) => ({ title, content }));
  }, [isParentFlex, isParentGrid, includeOnly, exclude]);

  return (
    <StyleFormContext>
      <Box
        sx={{
          mb: 20,
          zIndex: wpTheme.zIndex.layout + 1,
        }}
      >
        <Accordions size="medium" items={accordionItems} />
      </Box>
    </StyleFormContext>
  );
};
