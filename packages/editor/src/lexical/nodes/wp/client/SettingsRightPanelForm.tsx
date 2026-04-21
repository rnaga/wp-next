import { SxProps } from "@mui/material";

import { AttributesRightPanelForm } from "./AttributesRightPanelForm";
import { DynamicAttributesForm } from "./DynamicAttributesForm";

import type { WPElementNode, WPTextNode } from "..";

export const SettingsRightPanelForm = (props: {
  targetNode?: WPElementNode | WPTextNode;
  title?: string;
  sx?: SxProps;
  isChild?: boolean;
  hideAttributeKeys?: string[];
}) => {
  return (
    <>
      <AttributesRightPanelForm {...props} />
      <DynamicAttributesForm {...props} />
    </>
  );
};
