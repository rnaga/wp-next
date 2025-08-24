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

export default function LightEditorMenuControls() {
  const theme = useTheme();
  return (
    <MenuControlsContainer>
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
      <MenuDivider />
    </MenuControlsContainer>
  );
}
