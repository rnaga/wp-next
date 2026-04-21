import { useEffect, useMemo, useState } from "react";
import { useStyleForm } from "../use-style-form";
import { ButtonGroup } from "../../../forms/components/ButtonGroup";
import { Box } from "@mui/material";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import {
  SelectGlobal,
  type ValueGlobal,
} from "../text-decoration/SelectGlobal";

type SpacingType = "normal" | "length" | "global" | undefined;

type ValueNormal = "normal";
type ValueLength = string | number;

export const LetterSpacing = () => {
  const { formDataRef, updateFormData } = useStyleForm();

  const [spacingType, setSpacingType] = useState<SpacingType>();
  const [value, setValue] = useState<ValueNormal | ValueLength | ValueGlobal>();

  useEffect(() => {
    const styleLetterSpacing = formDataRef.current.__letterSpacing;
    const type = styleLetterSpacing?.$type;

    setSpacingType(type);
    setValue(styleLetterSpacing?.letterSpacing);
  }, [formDataRef]);

  const handleChange = (value: string | undefined) => {
    setSpacingType(value as SpacingType);

    // Set normal value when type is normal
    if (value === "normal") {
      setValue("normal");
      updateFormData({
        __letterSpacing: {
          $type: "normal",
          letterSpacing: "normal",
        },
      });

      return;
    }

    if (value === undefined) {
      updateFormData({
        __letterSpacing: {
          $type: undefined,
          letterSpacing: undefined,
        },
      });
    }

    // Reset value when type changes
    setValue(undefined);
  };

  const handleChangeSpacing = (value: string | undefined) => {
    setValue(value);
    updateFormData({
      __letterSpacing: {
        $type: spacingType,
        letterSpacing: value,
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
        value={spacingType ?? ""}
        onChange={handleChange}
        enum={[
          { value: "normal", label: "Normal" },
          { value: "length", label: "Length" },
          { value: "global", label: "Global" },
        ]}
      />

      {spacingType === "length" && (
        <StyleLengthInput
          key="length"
          onChange={handleChangeSpacing}
          value={value ?? ""}
          excludeUnits={["auto"]}
        />
      )}

      {spacingType === "global" && (
        <SelectGlobal
          value={value as ValueGlobal}
          onChange={handleChangeSpacing}
        />
      )}
    </Box>
  );
};
