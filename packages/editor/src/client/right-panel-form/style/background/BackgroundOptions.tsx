import { createContext, useContext } from "react";

import { Box, FormControl } from "@mui/material";
import { Accordions } from "@rnaga/wp-next-ui/Accordions";

import { ButtonGroup, FormLabelText } from "../../../forms/components";

import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";

import type * as types from "../../../../types";
import { parseLengthValue } from "../../../../lexical/styles/length-value";

const Context = createContext<{
  value?: types.CSSBackgroundAdvancedOptions;
  onChange: (value: Partial<types.CSSBackgroundAdvancedOptions>) => void;
}>({} as any);

const PositionAndSize = () => {
  const { value, onChange } = useContext(Context);
  const { top = 0, left = 0 } = value?.position || {};
  const size = value?.size || {
    keyword: undefined,
    width: undefined,
    height: undefined,
  };

  // Check if position is defined
  const isPositionDefined = top !== undefined || left !== undefined;

  const isKeywordDefined = size.keyword !== undefined;
  const isSizeDefined = size.width !== undefined || size.height !== undefined;

  const handleChange = (
    newValue: Partial<types.CSSBackgroundAdvancedOptions>
  ) => {
    // Get left and top values from the current value or default to 0
    const top = newValue.position?.top ?? value?.position?.top ?? 0;
    const left = newValue.position?.left ?? value?.position?.left ?? 0;

    const sizeWidth = parseLengthValue(newValue.size?.width ?? "");
    const sizeHeight = parseLengthValue(newValue.size?.height ?? "");

    const size = {
      keyword: newValue.size?.keyword ?? undefined,
      width: sizeWidth.value !== "" ? newValue.size?.width : undefined,
      height: sizeHeight.value !== "" ? newValue.size?.height : undefined,
    };

    // With the new values, check if size is defined
    const isSizeDefined =
      size.keyword !== undefined ||
      size.width !== undefined ||
      size.height !== undefined;

    // Unset position if both top and left are 0, and size are not defined
    if (top === 0 && left === 0 && !isSizeDefined) {
      onChange({
        position: undefined,
        size: undefined,
      });
      return;
    }

    // Otherwise, update the position and size
    onChange({
      position: {
        top,
        left,
      },
      size,
    });
  };

  return (
    <>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1,
          my: 1,
        }}
      >
        <FormControl fullWidth>
          <FormLabelText label="Top" />
          <StyleLengthInput
            key="top"
            outOfRange={top < -500 || top > 500}
            onChange={(val) => {
              const parsed = parseLengthValue(val ?? "");
              if (parsed && parsed.unit === "%") {
                handleChange({
                  position: {
                    left: value?.position?.left,
                    top: parseInt(parsed.value),
                  },
                });
              }
            }}
            value={`${top}%`}
            includeUnits={["%"]}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabelText label="Left" />
          <StyleLengthInput
            key="left"
            outOfRange={left < -500 || left > 500}
            onChange={(val) => {
              const parsed = parseLengthValue(val ?? "");
              if (parsed && parsed.unit === "%") {
                handleChange({
                  position: {
                    top: value?.position?.top,
                    left: parseInt(parsed.value),
                  },
                });
              }
            }}
            value={`${left}%`}
            includeUnits={["%"]}
          />
        </FormControl>
      </Box>

      <>
        {!isSizeDefined && (
          <FormControl fullWidth>
            <FormLabelText label="Size Keyword" />
            <ButtonGroup
              enum={[
                { value: "cover", label: "Cover" },
                { value: "contain", label: "Contain" },
              ]}
              onChange={(value) => {
                handleChange({
                  size: {
                    keyword: value as "cover" | "contain" | undefined,
                  },
                });
              }}
              value={value?.size?.keyword}
            />
          </FormControl>
        )}
        {!isKeywordDefined && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 1,
              my: 1,
            }}
          >
            <FormControl fullWidth>
              <FormLabelText label="Width" />
              <StyleLengthInput
                key="width"
                onChange={(val) => {
                  const parsed = parseLengthValue(val ?? "");
                  if (parsed) {
                    handleChange({
                      size: {
                        width: parsed.value + parsed.unit,
                        height: value?.size?.height,
                      },
                    });
                  }
                }}
                value={
                  value?.size?.width
                    ? value.size.width
                    : value?.size?.height
                      ? "auto"
                      : ""
                }
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabelText label="Height" />
              <StyleLengthInput
                key="height"
                onChange={(val) => {
                  const parsed = parseLengthValue(val ?? "");
                  if (parsed) {
                    handleChange({
                      size: {
                        width: value?.size?.width,
                        height: parsed.value + parsed.unit,
                      },
                    });
                  }
                }}
                value={value?.size?.height || ""}
              />
            </FormControl>
          </Box>
        )}
      </>
    </>
  );
};

const MoreOptions = () => {
  const { value, onChange } = useContext(Context);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <FormControl fullWidth>
        <FormLabelText label="Clip" />
        <ButtonGroup
          enum={[
            { value: "border-box", label: "Border Box" },
            { value: "padding-box", label: "Padding Box" },
            { value: "content-box", label: "Content Box" },
            { value: "text", label: "Text" },
          ]}
          onChange={(value) => {
            onChange({
              clip: value as types.CSSBackgroundAdvancedOptions["clip"],
            });
          }}
          value={value?.clip}
          fontSize={9}
          showCount={4}
        />
      </FormControl>
      <FormControl fullWidth>
        <FormLabelText label="Origin" />
        <ButtonGroup
          enum={[
            { value: "border-box", label: "Border Box" },
            { value: "padding-box", label: "Padding Box" },
            { value: "content-box", label: "Content Box" },
          ]}
          onChange={(value) => {
            onChange({
              origin: value as types.CSSBackgroundAdvancedOptions["origin"],
            });
          }}
          value={value?.origin}
          fontSize={9}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabelText label="Attachment" />
        <ButtonGroup
          enum={[
            { value: "scroll", label: "Scroll" },
            { value: "fixed", label: "Fixed" },
            { value: "local", label: "Local" },
          ]}
          onChange={(value) => {
            onChange({
              attachment:
                value as types.CSSBackgroundAdvancedOptions["attachment"],
            });
          }}
          value={value?.attachment}
        />
      </FormControl>
      <FormControl fullWidth>
        <FormLabelText label="Repeat" />
        <ButtonGroup
          enum={[
            { value: "repeat", label: "Repeat" },
            { value: "no-repeat", label: "No Repeat" },
            { value: "repeat-x", label: "Repeat X" },
            { value: "repeat-y", label: "Repeat Y" },
          ]}
          onChange={(value) => {
            onChange({
              repeat: value as types.CSSBackgroundAdvancedOptions["repeat"],
            });
          }}
          value={value?.repeat}
          fontSize={9}
          showCount={4}
        />
      </FormControl>
    </Box>
  );
};

export const BackgroundOptions = (props: {
  value?: types.CSSBackgroundAdvancedOptions;
  onChange: (value: Partial<types.CSSBackgroundAdvancedOptions>) => void;
  items?: Parameters<typeof Accordions>[0]["items"];
}) => {
  const { value, onChange, items } = props;
  return (
    <Context value={{ value, onChange }}>
      <Accordions
        size="small"
        allowSingleExpanded
        items={[
          ...(items || []),
          { title: "Position and Size", content: <PositionAndSize /> },
          { title: "More Options", content: <MoreOptions /> },
        ]}
        defaultExpanded={[]}
        sx={{
          width: "100%",
          "& .MuiAccordionDetails-root": {
            px: 0.5,
          },
          "& .MuiAccordionSummary-root": {
            px: 0.5,
          },
        }}
      />
    </Context>
  );
};
