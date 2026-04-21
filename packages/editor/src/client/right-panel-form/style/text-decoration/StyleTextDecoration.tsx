import { useEffect, useRef, useState } from "react";

import { Box, FormControl } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputColor } from "@rnaga/wp-next-ui/InputColor";
import { InputClickField } from "@rnaga/wp-next-ui/InputClickField";

import { FormLabelText } from "../../../forms/components";
import { useStyleForm } from "../use-style-form";
import { SelectLine } from "./SelectLine";
import { Thickness } from "./Thickness";
import { Select } from "@rnaga/wp-next-ui/Select";

export const StyleTextDecoration = () => {
  const { formDataRef, updateFormData, savePrevValue, getPrevValue } =
    useStyleForm();
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLElement>(null);

  const [value, setValue] = useState<string>();

  const handleClose = () => {
    setOpen(false);
  };

  const handleClear = () => {
    updateFormData({
      textDecorationLine: undefined,
      textDecorationColor: undefined,
      textDecorationStyle: undefined,
      __textDecorationThickness: undefined,
    });
    setValue(undefined);
  };

  const handleSubmit = () => {
    handleClose();
  };

  const handleCancel = () => {
    // Restore the saved values
    const prevLine = getPrevValue("textDecorationLine");
    const prevColor = getPrevValue("textDecorationColor");
    const prevStyle = getPrevValue("textDecorationStyle");
    const prevThickness = getPrevValue("__textDecorationThickness");

    updateFormData({
      textDecorationLine: prevLine,
      textDecorationColor: prevColor,
      textDecorationStyle: prevStyle,
      __textDecorationThickness: prevThickness,
    });

    handleClose();
  };

  // Save the previous values when the dialog opens
  useEffect(() => {
    if (open) {
      savePrevValue((css) => ({
        textDecorationLine: css.textDecorationLine,
        textDecorationColor: css.textDecorationColor,
        textDecorationStyle: css.textDecorationStyle,
        __textDecorationThickness: css.__textDecorationThickness,
      }));
    }
  }, [open]);

  useEffect(() => {
    const line = formDataRef.current.textDecorationLine;
    const color = formDataRef.current.textDecorationColor;
    const style = formDataRef.current.textDecorationStyle;
    const thickness =
      formDataRef.current.__textDecorationThickness?.textDecorationThickness;

    // Build the CSS text-decoration value
    const parts = [line, color, style, thickness].filter(Boolean);
    const newValue = parts.join(" ").trim();

    setValue(newValue.length > 0 ? newValue : undefined);
  }, [formDataRef.current]);

  return (
    <>
      <InputClickField
        canClear
        ref={inputRef}
        label={value ?? "Text Decoration"}
        value={value}
        onClick={() => {
          setOpen(true);
        }}
        sx={{
          minWidth: 220,
        }}
        onClear={handleClear}
      />
      <DraggableBox
        open={open}
        onClose={handleCancel}
        targetRef={inputRef}
        title="Text Decorator"
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            mb: 1,
            gap: 1,
          }}
        >
          <FormControl fullWidth>
            <FormLabelText label="Line" />
            <SelectLine />
          </FormControl>
          <FormControl fullWidth>
            <FormLabelText label="Color" />
            <InputColor
              value={formDataRef.current.textDecorationColor ?? ""}
              onChange={(value) => {
                updateFormData({
                  textDecorationColor: value,
                });
              }}
            />
          </FormControl>
          <FormControl fullWidth>
            <FormLabelText label="Style" />
            <Select
              enum={[
                { label: "no value", value: "" },
                { label: "solid", value: "solid" },
                { label: "double", value: "double" },
                { label: "dotted", value: "dotted" },
                { label: "dashed", value: "dashed" },
                { label: "wavy", value: "wavy" },
                { label: "inherit", value: "inherit" },
                { label: "initial", value: "initial" },
                { label: "unset", value: "unset" },
                { label: "revert", value: "revert" },
                { label: "revert-layer", value: "revert-layer" },
              ]}
              value={formDataRef.current.textDecorationStyle ?? ""}
              onChange={(value) => {
                updateFormData({
                  textDecorationStyle: value,
                });
              }}
            />
          </FormControl>
          <FormControl fullWidth>
            <FormLabelText label="Thickness" />
            <Thickness />
          </FormControl>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
              mt: 1,
            }}
          >
            <Button size="small" onClick={handleSubmit}>
              Submit
            </Button>
            <Button size="small" color="error" onClick={handleCancel}>
              Cancel
            </Button>
          </Box>
        </Box>
      </DraggableBox>
    </>
  );
};
