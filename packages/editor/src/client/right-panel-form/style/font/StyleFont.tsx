import { RefObject, useEffect, useRef, useState } from "react";
import { GoogleFontSelector } from "./GoogleFontSelector";
import { Box, IconButton, Typography } from "@mui/material";
import { CustomFontSelector } from "./CustomFontSelector";
import { useSelectedNode } from "../../../global-event";
import { ManualFontSelector } from "./ManualFontSelector";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { NODE_PROPERTY_UPDATED } from "../../../node-event";
import { COMMAND_PRIORITY_HIGH } from "lexical";

import { Accordions } from "@rnaga/wp-next-ui/Accordions";

import { CSSTypography } from "../../../../types";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";

import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { WP_BREAKPOINT_DEVICE_CHANGED_COMMAND } from "../../../breakpoint/commands";
import { WPLexicalNode } from "../../../../lexical/nodes/wp";
import { InputClickField } from "@rnaga/wp-next-ui/InputClickField";
import { updateCSSTypography } from "../../../../lexical/styles/typography";

const WrapDraggableBox = (props: {
  open: boolean;
  targetRef: RefObject<HTMLElement | null>;
  onClose: VoidFunction;
}) => {
  const { onClose, open, targetRef } = props;

  return (
    <DraggableBox
      open={open}
      onClose={onClose}
      targetRef={targetRef}
      title="Font Family"
    >
      <Box
        sx={{
          width: 300,
        }}
      >
        <Accordions
          defaultExpanded={[2]}
          allowSingleExpanded
          items={[
            {
              title: "Google Fonts",
              content: <GoogleFontSelector onClose={onClose} />,
            },
            {
              title: "Custom Fonts",
              content: <CustomFontSelector onClose={onClose} />,
            },
            {
              title: "Enter Manually",
              content: <ManualFontSelector onClose={onClose} />,
            },
          ]}
          sx={{
            "& .MuiAccordionDetails-root": {
              px: 0,
            },
          }}
          slotProps={{
            summary: {
              sx: {
                px: 0.5,
              },
            },
          }}
        />
      </Box>
    </DraggableBox>
  );
};

export const StyleFont = () => {
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const [fontFamily, setFontFamily] = useState<string>();
  const [cssTypography, setCSSTypography] = useState<CSSTypography>();
  const { selectedNode } = useSelectedNode();

  const inputRef = useRef<HTMLElement | null>(null);

  const [openModal, setOpenModal] = useState(false);

  const updateFont = (node?: WPLexicalNode) => {
    node = node ?? selectedNode;
    if (!node) {
      return;
    }

    const cssTypography: CSSTypography = editor.read(
      () => node.getLatest()?.__css?.get()?.__font
    );
    setFontFamily(cssTypography?.fontFamily || undefined);
    setCSSTypography(cssTypography);
  };

  useEffect(() => {
    updateFont();
  }, [selectedNode]);

  useEffect(() => {
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ node }) => {
        updateFont(node);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode]);

  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_BREAKPOINT_DEVICE_CHANGED_COMMAND,
      () => {
        updateFont();
      }
    );
  }, [selectedNode]);

  const handleClose = () => {
    setOpenModal(false);
  };

  const handleClear = async () => {
    if (!selectedNode) {
      return;
    }

    // Remove the current font from __css
    await updateCSSTypography(editor, selectedNode, undefined, {
      fontFamily: undefined,
    });

    setFontFamily(undefined);
    setCSSTypography(undefined);
  };

  const placeholder = fontFamily
    ? `${fontFamily?.replace(/"/g, "")} (${
        cssTypography?.$type === "raw" ? "manual" : cssTypography?.$type
      })`
    : "Font Family";

  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 100,
      }}
    >
      <WrapDraggableBox
        open={openModal}
        onClose={handleClose}
        targetRef={inputRef}
      />

      <CSSVariableBadge keyofUsage="fontFamily" syntax={["font"]}>
        <InputClickField
          ref={inputRef}
          label={placeholder}
          value={fontFamily}
          canClear={!!fontFamily}
          onClick={() => {
            setOpenModal(true);
          }}
          onClear={handleClear}
          sx={{
            minWidth: 220,
          }}
        />
      </CSSVariableBadge>
    </Box>
  );
};
