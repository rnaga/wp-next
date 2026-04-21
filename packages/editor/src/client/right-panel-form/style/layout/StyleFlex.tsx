import { useMemo } from "react";

import {
  createExtractFormData,
  createTransformFormDataValue,
} from "../../../forms/utils";
import { useStyleForm } from "../use-style-form";
import { FormFlexBox, FormStyleControl } from "../../../forms/components";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { Select } from "@rnaga/wp-next-ui/Select";
import { useSelectedNode } from "../../../global-event";

const extractFormData = createExtractFormData(
  [
    "display",
    "flexDirection",
    "justifyContent",
    "alignItems",
    "rowGap",
    "columnGap",
  ],
  "__layout"
);

export const StyleFlex = (props: { display: "flex" | "inline-flex" }) => {
  const { display } = props;
  const { selectedNode } = useSelectedNode();

  const { formDataRef, updateFormData } = useStyleForm();

  const transformValue = useMemo(
    () => createTransformFormDataValue(extractFormData(formDataRef.current)),
    [formDataRef.current, selectedNode]
  );

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
        <FormStyleControl title="flexDirection" width="100%">
          <Select
            key="flexDirection"
            onChange={handleChange("flexDirection")}
            enum={[
              { value: "row", label: "Row" },
              { value: "column", label: "Column" },
            ]}
            value={transformValue("flexDirection", String, "row")}
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
              { value: "flex-start", label: "Flex Start" },
              { value: "flex-end", label: "Flex End" },
              { value: "center", label: "Center" },
              { value: "space-between", label: "Space Between" },
              { value: "space-around", label: "Space Around" },
              { value: "space-evenly", label: "Space Evenly" },
              { value: "start", label: "Start" },
              { value: "end", label: "End" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            value={transformValue("justifyContent", String, "flex-start")}
          />
        </FormStyleControl>
        <FormStyleControl title="Align Items">
          <Select
            key="alignItems"
            onChange={handleChange("alignItems")}
            enum={[
              { value: "stretch", label: "Stretch" },
              { value: "flex-start", label: "Flex Start" },
              { value: "flex-end", label: "Flex End" },
              { value: "center", label: "Center" },
              { value: "baseline", label: "Baseline" },
              { value: "start", label: "Start" },
              { value: "end", label: "End" },
              { value: "self-start", label: "Self Start" },
              { value: "self-end", label: "Self End" },
              { value: "normal", label: "Normal" },
            ]}
            value={transformValue("alignItems", String, "stretch")}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Gap Row">
          <StyleLengthInput
            key="flexRowGap"
            value={extractFormData(formDataRef.current)?.["rowGap"]}
            onChange={handleChange("rowGap")}
          />
        </FormStyleControl>
        <FormStyleControl title="Gap Column">
          <StyleLengthInput
            key="flexColumnGap"
            value={extractFormData(formDataRef.current)?.["columnGap"]}
            onChange={handleChange("columnGap")}
          />
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};
