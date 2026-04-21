import { useState } from "react";
import {
  ButtonGroup,
  FormFlexBox,
  FormStyleControl,
} from "../../../forms/components";
import { StyleFont } from "../font/StyleFont";
import { useStyleForm } from "../use-style-form";
import { createExtractFormData } from "../../../forms/utils";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { useSelectedNode } from "../../../global-event";
import {
  $getGoogleFontNode,
  $syncGoogleFont,
} from "../../../../lexical/nodes/font/GoogleFontNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { InputColor } from "@rnaga/wp-next-ui/InputColor";
import { SelectMultiple } from "@rnaga/wp-next-ui/SelectMultiple";

import type * as types from "../../../../types";
import { StyleTextDecoration } from "../text-decoration/StyleTextDecoration";
import { LetterSpacing } from "./LetterSpacing";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import { Box, FormLabel, Collapse } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { TextShadow } from "./TextShadow";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Button } from "@rnaga/wp-next-ui/Button";
import { StyleLengthInputWithCSSVariable } from "../../../forms/components/StyleLengthInputWithCSSVariable";

const extractFontFormData = createExtractFormData(
  ["$type", "$slug", "fontFamily", "fontWeight", "fontStyle"],
  "__font"
);
const extractFormData = createExtractFormData([
  "fontSize",
  "lineHeight",
  "textAlign",
  "color",
]);

export const StyleTypography = () => {
  const { formDataRef, updateFormData, getFormKey } = useStyleForm();
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFontChange =
    (name: string) => (value: string | null | undefined) => {
      if (value === null || value === undefined || !selectedNode) return;
      const newFormData = {
        ...extractFontFormData(formDataRef.current),
        [name]: value,
      };

      updateFormData({
        __font: newFormData,
      });

      if (name !== "fontWeight" && name !== "fontStyle") {
        return;
      }

      // Google Font API requires fontWeight and fontStyle to be set
      // Therefore it needs to be synced
      editor.update(
        () => {
          $syncGoogleFont(editor);
        },
        {
          discrete: true,
        }
      );
    };

  const handleChange = (name: string) => (value: string | null | undefined) => {
    if (value === null) return;
    const newFormData = {
      ...extractFormData(formDataRef.current),
      [name]: value,
    };

    updateFormData(newFormData);
  };

  return (
    <>
      <StyleFont />

      <FormFlexBox>
        <FormStyleControl title="Font Weight" width="100%">
          <Select
            onChange={handleFontChange("fontWeight")}
            enum={[
              { value: "", label: "Default" },
              { value: "100", label: "Thin (100)" },
              { value: "200", label: "Extra Light (200)" },
              { value: "300", label: "Light (300)" },
              { value: "400", label: "Regular (400)" },
              { value: "500", label: "Medium (500)" },
              { value: "600", label: "Semi Bold (600)" },
              { value: "700", label: "Bold (700)" },
              { value: "800", label: "Extra Bold (800)" },
              { value: "900", label: "Black (900)" },
            ]}
            value={String(
              extractFontFormData(formDataRef.current).fontWeight ?? ""
            )}
          />
        </FormStyleControl>
      </FormFlexBox>

      <FormFlexBox>
        <FormStyleControl title="Color" width="100%">
          <CSSVariableBadge keyofUsage="color" syntax={["color"]}>
            <InputColor
              value={formDataRef.current?.["color"] ?? "#000000"}
              onChange={handleChange("color")}
              sx={{
                width: "100%",
              }}
            />
          </CSSVariableBadge>
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Font Size">
          <StyleLengthInputWithCSSVariable
            keyofUsage="fontSize"
            syntax={["length"]}
            key={getFormKey("fontSize")}
            onChange={handleChange("fontSize")}
            value={formDataRef.current?.["fontSize"]}
          />
        </FormStyleControl>
        <FormStyleControl title="Line Height">
          <StyleLengthInputWithCSSVariable
            keyofUsage="lineHeight"
            syntax={["length"]}
            key={getFormKey("lineHeight")}
            onChange={handleChange("lineHeight")}
            value={formDataRef.current?.["lineHeight"]}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Text Indent">
          <StyleLengthInputWithCSSVariable
            keyofUsage="textIndent"
            syntax={["length"]}
            key={getFormKey("textIndent")}
            onChange={handleChange("textIndent")}
            value={formDataRef.current?.["textIndent"]}
          />
        </FormStyleControl>
        <FormStyleControl title="Font Style">
          <ButtonGroup
            fontSize={10}
            value={extractFontFormData(formDataRef.current).fontStyle ?? ""}
            onChange={handleFontChange("fontStyle")}
            enum={[
              {
                value: "normal",
                label: <span style={{ fontStyle: "normal" }}>Normal</span>,
              },
              {
                value: "italic",
                label: <span style={{ fontStyle: "italic" }}>Italic</span>,
              },
            ]}
          />
        </FormStyleControl>
      </FormFlexBox>

      <FormFlexBox>
        <FormStyleControl title="Text Align" width="100%">
          <ButtonGroup
            value={formDataRef.current?.["textAlign"]}
            onChange={handleChange("textAlign")}
            enum={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
              { value: "justify", label: "Justify" },
              { value: "inherit", label: "Inherit" },
              { value: "initial", label: "Initial" },
            ]}
          />
        </FormStyleControl>
      </FormFlexBox>

      <Button
        size="small"
        onClick={() => setShowAdvanced(!showAdvanced)}
        endIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        sx={{
          textTransform: "none",
          backgroundColor: "rgba(0, 0, 0, 0.08)",
          color: "text.secondary",
          fontSize: "0.75rem",
          width: "100%",
          py: 0.5,
          mt: 1,
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.12)",
          },
        }}
      >
        {showAdvanced ? "Hide" : "Show"} more options
      </Button>

      <Collapse in={showAdvanced}>
        <FormFlexBox>
          <FormStyleControl title="Text Decoration" width="100%">
            <CSSVariableBadge
              keyofUsage="textDecoration"
              syntax={["string", "universal"]}
              sx={{
                width: "100%",
              }}
            >
              <StyleTextDecoration />
            </CSSVariableBadge>
          </FormStyleControl>
        </FormFlexBox>
        <FormFlexBox>
          <FormStyleControl title="Letter Spacing" width="100%">
            <LetterSpacing />
          </FormStyleControl>
        </FormFlexBox>
        <FormFlexBox>
          <FormStyleControl title="Text Transform" width="100%">
            <ButtonGroup
              value={formDataRef.current?.["textTransform"]}
              onChange={handleChange("textTransform")}
              enum={[
                { value: "uppercase", label: "AA" },
                { value: "capitalize", label: "Aa" },
                { value: "lowercase", label: "aa" },
                { value: "inherit", label: "Inherit" },
                { value: "initial", label: "Initial" },
                { value: "unset", label: "Unset" },
                { value: "revert", label: "Revert" },
                { value: "revert-layer", label: "Revert Layer" },
              ]}
              slotSxProps={{
                button: {
                  textTransform: "none",
                },
              }}
            />
          </FormStyleControl>
        </FormFlexBox>
        <FormFlexBox>
          <FormStyleControl title="Word Break">
            <Select
              enum={[
                { value: "", label: "" },
                { value: "normal", label: "Normal" },
                { value: "break-all", label: "Break All" },
                { value: "keep-all", label: "Keep All" },
                { value: "break-word", label: "Break Word" },
                { value: "inherit", label: "Inherit" },
                { value: "initial", label: "Initial" },
                { value: "unset", label: "Unset" },
                { value: "revert", label: "Revert" },
                { value: "revert-layer", label: "Revert Layer" },
              ]}
              value={formDataRef.current?.["wordBreak"] ?? ""}
              onChange={handleChange("wordBreak")}
            />
          </FormStyleControl>
          <FormStyleControl title="Line Break">
            <Select
              enum={[
                { value: "", label: "" },
                { value: "auto", label: "Auto" },
                { value: "loose", label: "Loose" },
                { value: "normal", label: "Normal" },
                { value: "strict", label: "Strict" },
                { value: "anywhere", label: "Anywhere" },
                { value: "inherit", label: "Inherit" },
                { value: "initial", label: "Initial" },
                { value: "unset", label: "Unset" },
                { value: "revert", label: "Revert" },
                { value: "revert-layer", label: "Revert Layer" },
              ]}
              value={formDataRef.current?.["lineBreak"] ?? ""}
              onChange={handleChange("lineBreak")}
            />
          </FormStyleControl>
        </FormFlexBox>
        <FormFlexBox>
          <FormStyleControl title="Text Wrap" width="100%">
            <ButtonGroup
              value={formDataRef.current?.["textWrap"] ?? ""}
              onChange={handleChange("textWrap")}
              enum={[
                { value: "wrap", label: "Wrap" },
                { value: "nowrap", label: "No Wrap" },
                { value: "balance", label: "Balance" },
                { value: "pretty", label: "Pretty" },
                { value: "stable", label: "Stable" },
                { value: "inherit", label: "Inherit" },
                { value: "initial", label: "Initial" },
                { value: "unset", label: "Unset" },
                { value: "revert", label: "Revert" },
                { value: "revert-layer", label: "Revert Layer" },
              ]}
              showCount={2}
            />
          </FormStyleControl>
        </FormFlexBox>
        <FormFlexBox>
          <FormStyleControl title="Text Overflow" width="100%">
            <ButtonGroup
              value={formDataRef.current?.["textOverflow"]}
              onChange={handleChange("textOverflow")}
              enum={[
                { value: "clip", label: "Clip" },
                { value: "ellipsis", label: "Ellipsis" },
                { value: "inherit", label: "Inherit" },
                { value: "initial", label: "Initial" },
                { value: "unset", label: "Unset" },
                { value: "revert", label: "Revert" },
                { value: "revert-layer", label: "Revert Layer" },
              ]}
              showCount={2}
            />
          </FormStyleControl>
        </FormFlexBox>
        <Box sx={{ my: 1 }}>
          <Typography>Text Shadow</Typography>

          <CSSVariableBadge
            keyofUsage="textShadow"
            syntax={["string", "universal"]}
            sx={{
              width: "100%",
            }}
          >
            <TextShadow />
          </CSSVariableBadge>
        </Box>
      </Collapse>
    </>
  );
};
