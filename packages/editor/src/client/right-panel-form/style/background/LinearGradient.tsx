import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { logger } from "../../../../lexical/logger";

import { Box, FormControl, Slider } from "@mui/material";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputColor, isColorString } from "@rnaga/wp-next-ui/InputColor";
import {
  SortableList,
  SortableListItemType,
} from "@rnaga/wp-next-ui/SortableList";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { Button } from "@rnaga/wp-next-ui/Button";
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
  types.CSSBackgroundImageLinearGradientValue["values"]
>[number];

const defaultColor = "#000"; // Default color for the gradient

const Context = createContext<{
  value: types.CSSBackgroundImageLinearGradientValue;
  updateGradientValue: (
    newValue: Pick<
      Partial<types.CSSBackgroundImageLinearGradientValue>,
      "degrees" | "values" | "advancedOptions"
    >
  ) => void;
  formValue: string;
  resetErrorMessage: () => void;
  setFormValue: (value: string) => void;
}>({} as any);

const Degrees = () => {
  const { value, updateGradientValue } = useContext(Context);
  const degrees = useMemo(() => value?.degrees, [value?.degrees]);

  return (
    <Box sx={{ mx: 1 }}>
      <Slider
        size="small"
        value={degrees ?? 0}
        onChange={(event, newValue) => {
          if (typeof newValue === "number") {
            //setDegrees(newValue);
            updateGradientValue({ degrees: newValue });
          }
        }}
        min={0}
        max={360}
        marks={[
          { value: 0, label: "0°" },
          { value: 90, label: "90°" },
          { value: 180, label: "180°" },
          { value: 270, label: "270°" },
          { value: 360, label: "360°" },
        ]}
        step={1}
        valueLabelDisplay="auto"
        sx={{
          "& .MuiSlider-markLabel": {
            fontSize: 10,
          },
        }}
      />
    </Box>
  );
};

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
        resetErrorMessage();
        break;
      case "percentage":
        const parsedPercentage = parseLengthValue(formValue, {
          defaultUnit: "%",
        });
        if (!parsedPercentage || parsedPercentage.unit !== "%") {
          logger.error("Invalid percentage value:", formValue);
          return;
        }
        updateGradientValue({
          values: [...value.values, `${parsedPercentage.value}%`],
        });

        // (prevValues) => [...prevValues, parsedPercentage.value]);
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
          value={formValue ?? "0%"}
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

export const LinearGradient = () => {
  const { itemIndex, onClose, onCancel } = useStyleBackgroundContext();
  const { addValue, updateValue, values, findValue } = useBackground();
  const [formValue, setFormValue] = useState<string>(defaultColor);

  const [value, setValue] =
    useState<types.CSSBackgroundImageLinearGradientValue>({
      $type: "linear-gradient",
      degrees: 0,
      values: [],
    });

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const updateGradientValue = (
    newValue: Pick<
      Partial<types.CSSBackgroundImageLinearGradientValue>,
      "degrees" | "values" | "advancedOptions"
    >
  ) => {
    //const advancedOptions = newValue.advancedOptions ?? {};
    const { $type, ...restValue } = value;
    const combinedValue: types.CSSBackgroundImageLinearGradientValue = {
      $type: "linear-gradient",
      ...restValue,
      ...newValue,
    };

    setValue(combinedValue);

    if (itemIndex !== undefined) {
      // Update the value in the background context if itemIndex is defined
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

    setErrorMessage(undefined); // Clear any previous error messages
    onClose(); // Close the form after submission
  };

  const handleCancel = () => {
    setValue({
      $type: "linear-gradient",
      degrees: 0,
      values: [],
    });

    setErrorMessage(undefined); // Clear any previous error messages
    setFormValue(defaultColor);
    onCancel(); // Close the form without saving changes
  };

  useEffect(() => {
    if (itemIndex === undefined) {
      return;
    }

    const css = findValue(itemIndex);
    if (css && css.$type === "linear-gradient") {
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
      <Box>
        <PreviewBox value={value} placeholder="No gradient added yet" />
        {(value.values?.length ?? 0) > 0 && (
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
      </Box>

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
            title: "Degrees",
            content: <Degrees />,
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
