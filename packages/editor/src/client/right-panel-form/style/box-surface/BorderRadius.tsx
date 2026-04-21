import React, { useEffect, useMemo, useState } from "react";
import { logger } from "../../../../lexical/logger";

import CropDinIcon from "@mui/icons-material/CropDin";
import CropFreeIcon from "@mui/icons-material/CropFree";
import { Box } from "@mui/material";

import { ButtonGroup } from "../../../forms/components/ButtonGroup";
import { FormFlexBox, FormStyleControl } from "../../../forms/components/Form";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { useStyleForm } from "../use-style-form";

import type * as types from "../../../../types";
import { radiusValueToCSS } from "../../../../lexical/styles/box-surface";

export const BorderRadius = () => {
  const { formDataRef, updateFormData, formKey } = useStyleForm();
  const [type, setType] = useState<"all" | "individual">(
    formDataRef.current.__borderRadius?.$type ?? "all"
  );

  // Use formKey (not selectedNode) as the dependency so that formDataRef.current
  // is already updated by StyleFormContext's syncFormData() before this effect runs.
  useEffect(() => {
    setType(formDataRef.current.__borderRadius?.$type ?? "all");
  }, [formKey]);

  const value = useMemo(
    () => formDataRef.current.__borderRadius,
    [formDataRef.current]
  ) as types.CSSBorderRadius;

  const handleChangeType = (newType: "all" | "individual") => {
    setType(newType);
    updateFormData({
      __borderRadius: {
        ...value,
        $type: newType,
      },
      borderRadius: radiusValueToCSS({
        ...value,
        $type: newType,
      }),
    });
  };

  const handleChangeAll = (newAllSideValue?: string) => {
    const newValue: types.CSSBorderRadius = {
      ...value,
      $type: "all",
      $all: newAllSideValue || "",
    };

    updateFormData({
      __borderRadius: newValue,
      borderRadius: radiusValueToCSS(newValue),
    });
  };

  const handleChangeIndividual = (
    side: "$top" | "$right" | "$bottom" | "$left",
    newSideValue?: string
  ) => {
    const newValue: types.CSSBorderRadius = {
      ...value,
      $type: "individual",
      [side]: newSideValue || "",
    };
    updateFormData({
      __borderRadius: newValue,
      borderRadius: radiusValueToCSS(newValue),
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        //gap: 0.5,
      }}
    >
      <ButtonGroup
        sx={{
          height: 24,
          width: "100%",
        }}
        slotSxProps={{
          buttonLabel: {
            display: "contents",
            my: 2,
          },
        }}
        enum={[
          {
            value: "all",
            //tooltip: "All sides",
            label: <CropDinIcon sx={{ fontSize: 16 }} />,
          },
          {
            value: "individual",
            //tooltip: "Individual",
            label: <CropFreeIcon sx={{ fontSize: 16 }} />,
          },
        ]}
        onChange={(value) => {
          logger.log(value);
          handleChangeType(value as "all" | "individual");
        }}
        value={type}
      />
      {type === "all" && (
        <StyleLengthInput
          value={value?.$all || ""}
          onChange={handleChangeAll}
          min={0}
          includeUnits={["px", "em", "rem"]}
          sx={{
            mt: 1.5,
          }}
        />
      )}
      {type === "individual" && (
        <Box>
          <FormFlexBox>
            {["$top", "$right"].map((side) => (
              <React.Fragment key={side}>
                <FormStyleControl title={side.replace("$", "")} width="100%">
                  <StyleLengthInput
                    min={0}
                    value={value?.[side as keyof types.CSSBorderRadius] || ""}
                    onChange={(value) => {
                      handleChangeIndividual(side as "$top" | "$right", value);
                    }}
                  />
                </FormStyleControl>
              </React.Fragment>
            ))}
          </FormFlexBox>
          <FormFlexBox>
            {["$bottom", "$left"].map((side) => (
              <React.Fragment key={side}>
                <FormStyleControl title={side.replace("$", "")} width="100%">
                  <StyleLengthInput
                    min={0}
                    value={value?.[side as keyof types.CSSBorderRadius] || ""}
                    onChange={(value) => {
                      handleChangeIndividual(
                        side as "$bottom" | "$left",
                        value
                      );
                    }}
                  />
                </FormStyleControl>
              </React.Fragment>
            ))}
          </FormFlexBox>
        </Box>
      )}
    </Box>
  );
};
