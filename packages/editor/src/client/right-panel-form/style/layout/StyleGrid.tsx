import { useCallback, useEffect, useMemo, useState } from "react";

import { FormFlexBox, FormStyleControl } from "../../../forms/components";
import { Input } from "@rnaga/wp-next-ui/Input";
import {
  createExtractFormData,
  createTransformFormDataValue,
} from "../../../forms/utils";
import { useStyleForm } from "../use-style-form";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { Select } from "@rnaga/wp-next-ui/Select";
import { useSelectedNode } from "../../../global-event";

const extractFormData = createExtractFormData(
  [
    "display",
    "gridTemplateColumns",
    "gridTemplateRows",
    "gridAutoFlow",
    "justifyContent",
    "alignItems",
    "rowGap",
    "columnGap",
  ],
  "__layout"
);

export const StyleGrid = (props: { display: "grid" | "inline-grid" }) => {
  const { display } = props;
  const { selectedNode } = useSelectedNode();

  const { formDataRef, updateFormData } = useStyleForm();

  const transformValue = useMemo(
    () => createTransformFormDataValue(extractFormData(formDataRef.current)),
    [formDataRef.current, selectedNode]
  );

  const templateValueCallback = (value: string) => value.split(" ").length;

  const handleTemplateChange = (name: string) => (value: string) => {
    const newValue = (name == "columns" ? "1fr " : "auto ")
      .repeat(parseInt(value))
      .trim();

    const newFormData = {
      ...extractFormData(formDataRef.current),
      display,
      [`gridTemplate${name.charAt(0).toUpperCase() + name.slice(1)}`]: newValue,
    };
    updateFormData({
      __layout: newFormData,
    });
  };

  const handleChange = (name: string) => (value: string | undefined) => {
    if (value === undefined) return;
    const newFormData = {
      ...extractFormData(formDataRef.current),
      display,
      [name]: value,
    };
    updateFormData({
      __layout: newFormData,
    });
  };

  return (
    <>
      <FormFlexBox>
        <FormStyleControl title="Columns">
          <Input
            key="gridTemplateColumns"
            onChange={handleTemplateChange("columns")}
            value={transformValue(
              "gridTemplateColumns",
              templateValueCallback,
              1
            )}
            type="number"
          />
        </FormStyleControl>
        <FormStyleControl title="Rows">
          <Input
            key="grid-template-rows"
            onChange={handleTemplateChange("rows")}
            value={transformValue("gridTemplateRows", templateValueCallback, 1)}
            type="number"
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Direction">
          <Select
            key="gridAutoFlow"
            onChange={handleChange("gridAutoFlow")}
            enum={[
              { value: "row", label: "Row" },
              { value: "column", label: "Column" },
            ]}
            value={transformValue("gridAutoFlow", String, "row")}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Justify Content">
          <Select
            key="justifyContent"
            onChange={handleChange("justifyContent")}
            enum={[
              { value: "stretch", label: "Stretch" },
              { value: "start", label: "Start" },
              { value: "end", label: "End" },
              { value: "center", label: "Center" },
              { value: "space-between", label: "Space Between" },
              { value: "space-around", label: "Space Around" },
              { value: "space-evenly", label: "Space Evenly" },
            ]}
            value={transformValue("justifyContent", String, "normal")}
          />
        </FormStyleControl>
        <FormStyleControl title="Align Items">
          <Select
            key="alignItems"
            onChange={handleChange("alignItems")}
            enum={[
              { value: "start", label: "Start" },
              { value: "end", label: "End" },
              { value: "center", label: "Center" },
              { value: "stretch", label: "Stretch" },
              { value: "baseline", label: "Baseline" },
            ]}
            value={transformValue("alignItems", String, "stretch")}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Gap Row">
          <StyleLengthInput
            key="rowGap"
            value={extractFormData(formDataRef.current)?.["rowGap"]}
            onChange={handleChange("rowGap")}
          />
        </FormStyleControl>
        <FormStyleControl title="Gap Column">
          <StyleLengthInput
            key="columnGap"
            value={extractFormData(formDataRef.current)?.["columnGap"]}
            onChange={handleChange("columnGap")}
          />
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};
