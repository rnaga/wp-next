import { ReactNode } from "react";
import { useTheme } from "@mui/material";
import {
  MenuButtonBold,
  MenuButtonItalic,
  MenuButtonRedo,
  MenuButtonStrikethrough,
  MenuButtonTextColor,
  MenuButtonUnderline,
  MenuButtonUndo,
  MenuControlsContainer,
  MenuDivider,
  MenuSelectHeading,
} from "mui-tiptap";

export default function LightEditorMenuControls(props?: {
  menuSize?: "small" | "medium" | "large";
  additionalMenuItems?: ReactNode;
}) {
  const theme = useTheme();
  const { menuSize = "medium", additionalMenuItems } = props || {};

  const sizeMap = {
    small: { fontSize: "0.875rem", iconSize: "1rem", height: "28px" },
    medium: { fontSize: "1rem", iconSize: "1.25rem", height: "32px" },
    large: { fontSize: "1.125rem", iconSize: "1.5rem", height: "40px" },
  };

  const size = sizeMap[menuSize];

  return (
    <MenuControlsContainer
      sx={{
        fontSize: size.fontSize,
        "& .MuiToggleButton-root": {
          fontSize: size.iconSize,
          height: size.height,
          minWidth: size.height,
          padding: "4px 8px",
        },
        "& .MuiSvgIcon-root": {
          fontSize: size.iconSize,
        },
        "& .MuiSelect-select": {
          fontSize: size.fontSize,
          height: size.height,
          minHeight: size.height,
          padding: "4px 8px",
        },
        "& .MuiInputBase-root": {
          fontSize: size.fontSize,
          height: size.height,
          minHeight: size.height,
        },
      }}
    >
      <MenuSelectHeading />

      <MenuButtonBold />

      <MenuButtonItalic />

      <MenuButtonUnderline />

      <MenuButtonStrikethrough />

      <MenuButtonTextColor
        defaultTextColor={theme.palette.text.primary}
        swatchColors={[
          { value: "#000000", label: "Black" },
          { value: "#ffffff", label: "White" },
          { value: "#888888", label: "Grey" },
          { value: "#ff0000", label: "Red" },
          { value: "#ff9900", label: "Orange" },
          { value: "#ffff00", label: "Yellow" },
          { value: "#00d000", label: "Green" },
          { value: "#0000ff", label: "Blue" },
        ]}
      />

      <MenuButtonUndo />
      <MenuButtonRedo />
      {additionalMenuItems && (
        <>
          <MenuDivider />
          {additionalMenuItems}
        </>
      )}
    </MenuControlsContainer>
  );
}
