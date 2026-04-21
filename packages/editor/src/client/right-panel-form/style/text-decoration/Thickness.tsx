import { useEffect, useMemo, useState } from "react";
import { useStyleForm } from "../use-style-form";
import { ButtonGroup } from "../../../forms/components/ButtonGroup";
import { Box } from "@mui/material";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { text } from "stream/consumers";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SelectGlobal, type ValueGlobal } from "./SelectGlobal";

type ThicknessType = "singleKeyword" | "length" | "global" | undefined;

type ValueSingleKeyword = "auto" | "from-font";
type ValueLength = string | number;

export const Thickness = () => {
  const { formDataRef, updateFormData } = useStyleForm();

  const [thicknessType, setThicknessType] = useState<ThicknessType>();
  const [value, setValue] = useState<
    ValueSingleKeyword | ValueLength | ValueGlobal
  >();

  useEffect(() => {
    const styleThickness = formDataRef.current.__textDecorationThickness;
    const type = styleThickness?.$type;

    setThicknessType(type);
    setValue(styleThickness?.textDecorationThickness);
  }, [formDataRef]);

  const handleChange = (value: string | undefined) => {
    setThicknessType(value as ThicknessType);

    // Reset value when type changes
    setValue(undefined);

    // Reset style if value is undefined
    if (value === undefined) {
      updateFormData({
        __textDecorationThickness: undefined,
      });
      return;
    }
  };

  const handleChangeThickness = (value: string | undefined) => {
    setValue(value);
    updateFormData({
      __textDecorationThickness: {
        $type: thicknessType,
        textDecorationThickness: value,
      },
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        mb: 1,
        gap: 1,
      }}
    >
      <ButtonGroup
        value={thicknessType ?? ""}
        onChange={handleChange}
        enum={[
          { value: "singleKeyword", label: "Single Keyword" },
          { value: "length", label: "Length" },
          { value: "global", label: "Global" },
        ]}
      />

      {thicknessType === "singleKeyword" && (
        <Select
          enum={[
            { value: "auto", label: "Auto" },
            { value: "from-font", label: "From Font" },
          ]}
          value={`${value ?? ""}`}
          onChange={handleChangeThickness}
        />
      )}

      {thicknessType === "length" && (
        <StyleLengthInput
          key="length"
          onChange={handleChangeThickness}
          value={value ?? ""}
        />
      )}

      {thicknessType === "global" && (
        <SelectGlobal
          value={value as ValueGlobal}
          onChange={handleChangeThickness}
        />
      )}
    </Box>
  );
};
