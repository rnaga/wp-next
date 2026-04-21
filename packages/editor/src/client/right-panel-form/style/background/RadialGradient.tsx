import { createContext, useContext, useEffect, useState } from "react";
import { logger } from "../../../../lexical/logger";

import { Box, FormControl } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputColor, isColorString } from "@rnaga/wp-next-ui/InputColor";
import {
  SortableList,
  SortableListItemType,
} from "@rnaga/wp-next-ui/SortableList";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { FormLabelText } from "../../../forms/components";
import { ButtonGroup } from "../../../forms/components/ButtonGroup";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { BackgroundOptions } from "./BackgroundOptions";
import { GradientListItem } from "./GradientListItem";
import { PreviewBox } from "./PreviewBox";
import { useStyleBackgroundContext } from "./StyleBackground";
import { useBackground } from "./use-background";

import type * as types from "../../../../types";
import { parseLengthValue } from "../../../../lexical/styles/length-value";

type Value = NonNullable<
  types.CSSBackgroundImageRadialGradientValue["values"]
>[number];

const defaultColor = "#000"; // Default color for the gradient

const defaultValue: Omit<types.CSSBackgroundImageRadialGradientValue, "$type"> =
  {
    top: 50,
    left: 50,
    endingShape: "circle",
    size: "closest-side",
    values: [],
  };

const Context = createContext<{
  value: types.CSSBackgroundImageRadialGradientValue;
  updateGradientValue: (
    newValue: Pick<
      Partial<types.CSSBackgroundImageRadialGradientValue>,
      "top" | "left" | "endingShape" | "size" | "values" | "advancedOptions"
    >
  ) => void;
  formValue: string;
  resetErrorMessage: () => void;
  setFormValue: (value: string) => void;
}>({} as any);

const Images = () => {
  const {
    value,
    updateGradientValue,
    formValue,
    setFormValue,
    resetErrorMessage,
  } = useContext(Context);

  const [valueType, setValueType] = useState<"color" | "percentage" | "custom">(
    "color"
  );

  const handleChangeValueType = (type?: string) => {
    type = !type ? "color" : type.toLowerCase();

    if (!["color", "percentage", "custom"].includes(type)) {
      logger.error("Invalid value type:", type);
      return;
    }

    setValueType(type as "color" | "percentage" | "custom");
    setFormValue(
      type === "color" ? defaultColor : type === "percentage" ? "0%" : ""
    ); // Reset form value when changing type
  };

  const handleAdd = () => {
    if (formValue === undefined || formValue === "") {
      logger.error("No value provided for color or percentage.");
      return;
    }

    switch (valueType) {
      case "color":
        if (!isColorString(formValue)) {
          logger.error("Invalid color value:", formValue);
          return;
        }
        updateGradientValue({
          values: [...value.values, formValue],
        });

        resetErrorMessage(); // Reset error message if any
        break;
      case "percentage":
        const parsedPercentage = parseLengthValue(formValue);
        if (!parsedPercentage || parsedPercentage.unit !== "%") {
          logger.error("Invalid percentage value:", formValue);
          return;
        }
        updateGradientValue({
          values: [...value.values, `${parsedPercentage.value}%`],
        });
        break;
      case "custom":
        if (formValue.trim() === "") {
          logger.error("Custom value cannot be empty.");
          return;
        }
        // Check if the value already exists
        if (value.values.some((v) => v === formValue)) {
          logger.warn("Custom value already exists:", formValue);
          return;
        }
        // Add the new value to the values array
        updateGradientValue({
          values: [...value.values, formValue],
        });
        break;
      default:
        break;
    }

    setFormValue(defaultColor); // Reset form value after adding
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        mb: 1,
      }}
    >
      <ButtonGroup
        value={valueType}
        onChange={handleChangeValueType}
        enum={[
          { value: "color", label: "Color" },
          { value: "percentage", label: "Percentage" },
          { value: "custom", label: "Custom" },
        ]}
        showCount={3}
      />
      {valueType === "color" && (
        <InputColor
          value={formValue ?? "#fff"}
          onChange={(color) => {
            setFormValue(color);
          }}
        />
      )}
      {valueType === "percentage" && (
        <StyleLengthInput
          onChange={(value) => {
            setFormValue(value ?? defaultColor);
          }}
          value={formValue}
          min={0}
          max={100}
          includeUnits={["%"]}
        />
      )}
      {valueType === "custom" && (
        <Input
          onChange={(value) => {
            setFormValue(value);
          }}
          sx={{ width: "100%" }}
        />
      )}
      <Button size="small" onClick={handleAdd}>
        Add {valueType}
      </Button>
    </Box>
  );
};

const Position = () => {
  const { value, updateGradientValue } = useContext(Context);

  return (
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
          outOfRange={value.top < -500 || value.top > 500}
          onChange={(val) => {
            const parsed = parseLengthValue(val ?? "");
            if (parsed && parsed.unit === "%") {
              updateGradientValue({ top: parseInt(parsed.value) });
            }
          }}
          value={`${value.top}%`}
          includeUnits={["%"]}
        />
      </FormControl>
      <FormControl fullWidth>
        <FormLabelText label="Left" />
        <StyleLengthInput
          key="left"
          outOfRange={value.left < -500 || value.left > 500}
          onChange={(val) => {
            const parsed = parseLengthValue(val ?? "");
            if (parsed && parsed.unit === "%") {
              updateGradientValue({ left: parseInt(parsed.value) });
            }
          }}
          value={`${value.left}%`}
          includeUnits={["%"]}
        />
      </FormControl>
    </Box>
  );
};

const EndingShapeAndSize = () => {
  const { value, updateGradientValue } = useContext(Context);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <FormControl fullWidth>
        <ButtonGroup
          value={value.endingShape}
          onChange={(value) => {
            updateGradientValue({
              endingShape:
                value as types.CSSBackgroundImageRadialGradientValue["endingShape"],
            });
          }}
          enum={[
            { label: "Circle", value: "circle" },
            { label: "Ellipse", value: "ellipse" },
          ]}
        />
      </FormControl>
      <FormControl fullWidth>
        <ButtonGroup
          value={value.size}
          onChange={(value) => {
            updateGradientValue({
              size: value as types.CSSBackgroundImageRadialGradientValue["size"],
            });
          }}
          enum={[
            { label: "Closest Side", value: "closest-side" },
            { label: "Closest Corner", value: "closest-corner" },
            { label: "Farthest Side", value: "farthest-side" },
            { label: "Farthest Corner", value: "farthest-corner" },
          ]}
          showCount={4}
          fontSize={9}
        />
      </FormControl>
    </Box>
  );
};

export const RadialGradient = () => {
  const { itemIndex, onClose, onCancel } = useStyleBackgroundContext();
  const { addValue, updateValue, values, findValue } = useBackground();
  const [formValue, setFormValue] = useState<string>(defaultColor);

  const [value, setValue] =
    useState<types.CSSBackgroundImageRadialGradientValue>({
      $type: "radial-gradient",
      ...defaultValue,
    });

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const updateGradientValue = (
    newValue: Pick<
      Partial<types.CSSBackgroundImageRadialGradientValue>,
      "top" | "left" | "endingShape" | "size" | "values" | "advancedOptions"
    >
  ) => {
    const { $type, ...restValue } = value;
    const combinedValue: types.CSSBackgroundImageRadialGradientValue = {
      $type: "radial-gradient",
      ...restValue,
      ...newValue,
    };

    setValue(combinedValue);

    // If itemIndex is defined, update the existing css value
    if (itemIndex !== undefined) {
      updateValue(itemIndex, combinedValue);
    }
  };

  const handleChange = (items: SortableListItemType[]) => {
    const newValues: Value[] = items.map((item) => item.value);
    updateGradientValue({ values: newValues });
  };

  const handleDelete = (index: number) => {
    const newValues = value?.values.filter((_, i) => i !== index);
    updateGradientValue({ values: newValues });
  };

  const handleSubmit = () => {
    if (value.values.filter(isColorString).length === 0) {
      setErrorMessage("At least one color value is required.");
      return;
    }

    if (itemIndex !== undefined) {
      updateValue(itemIndex, value);
    } else {
      addValue(value);
    }

    setErrorMessage(undefined);
    onClose(); // Close the form after submission
  };

  const handleCancel = () => {
    setValue({
      $type: "radial-gradient",
      ...defaultValue,
    });

    setErrorMessage(undefined);
    setFormValue(defaultColor);
    onCancel(); // Close the form without saving
  };

  useEffect(() => {
    if (itemIndex === undefined) {
      return;
    }

    const css = findValue(itemIndex);

    if (css && css.$type === "radial-gradient") {
      setValue(css);
      setFormValue(defaultColor); // Reset form value when loading existing CSS
    }
  }, [values, itemIndex]);

  return (
    <Context
      value={{
        value,
        updateGradientValue,
        formValue,
        setFormValue,
        resetErrorMessage: () => setErrorMessage(undefined),
      }}
    >
      <PreviewBox value={value} placeholder="No gradient added yet" />
      {value.values.length > 0 && (
        <SortableList
          enum={value.values.map((value, index) => ({
            value: value,
            label: value,
          }))}
          displayType="grid"
          size="small"
          onChange={handleChange}
          onDelete={handleDelete}
          renderItem={(item) => <GradientListItem value={item.value} />}
        />
      )}

      {errorMessage && (
        <Typography color="error" sx={{ my: 0.5 }}>
          {errorMessage}
        </Typography>
      )}

      <BackgroundOptions
        items={[
          {
            title: "Images",
            content: <Images />,
          },
          {
            title: "Position",
            content: <Position />,
          },
          {
            title: "Ending Shape and Size",
            content: <EndingShapeAndSize />,
          },
        ]}
        value={value.advancedOptions}
        onChange={(advancedOptions) => {
          const newValue = {
            ...value,
            advancedOptions: {
              ...value.advancedOptions,
              ...advancedOptions,
            },
          };
          updateGradientValue(newValue);
        }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1,
          mt: 1,
        }}
      >
        <Button size={"small"} onClick={handleSubmit}>
          Submit
        </Button>
        <Button size={"small"} color="error" onClick={handleCancel}>
          Cancel
        </Button>
      </Box>
    </Context>
  );
};
