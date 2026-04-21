import { createExtractFormData } from "../../../forms/utils";
import { Inset } from "./Inset";
import { useStyleForm } from "../use-style-form";
import {
  ButtonGroup,
  FormFlexBox,
  FormStyleControl,
} from "../../../forms/components";
import { Input } from "@rnaga/wp-next-ui/Input";
import { useEffect, useState } from "react";
import { Select } from "@rnaga/wp-next-ui/Select";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";

const extractFormData = createExtractFormData(
  ["position", "zIndex", "float", "clear"],
  "__position"
);

export const StylePosition = () => {
  const { formDataRef, updateFormData, formKey } = useStyleForm();
  const [openInset, setOpenInset] = useState(
    formDataRef.current.__position?.position
  );

  const handleChangePosition = (value: string | undefined) => {
    const newPosition = {
      position: value,
      // append zIndex, float, clear to the form data when changing position
      zIndex: formDataRef.current.__position?.zIndex,
      float: formDataRef.current.__position?.float,
      clear: formDataRef.current.__position?.clear,
    };

    updateFormData({
      __position: {
        ...newPosition,
        inset: undefined,
        __position: undefined,
      },
    });

    formDataRef.current.__position = {
      position: newPosition.position,
      zIndex: newPosition.zIndex,
      float: newPosition.float,
      clear: newPosition.clear,
    };

    setOpenInset(
      value && ["fixed", "absolute", "sticky"].includes(value) ? value : false
    );
  };

  const handleChange = (name: string) => (value: string | undefined) => {
    if (value === null) return;
    const newFormData = {
      ...extractFormData(formDataRef.current),
      position: formDataRef.current.__position.position,
      [name]: value,
    };

    updateFormData({
      __position: newFormData,
    });
  };

  const handleChangeZIndex = (value: string) => {
    updateFormData({
      __position: {
        ...formDataRef.current.__position,
        zIndex: value,
      },
    });
  };

  useEffect(() => {
    const pos = formDataRef.current.__position?.position;
    setOpenInset(
      pos && ["fixed", "absolute", "sticky"].includes(pos) ? pos : false
    );
  }, [formDataRef.current.__position?.position]);

  return (
    <>
      <ButtonGroup
        value={formDataRef.current.__position?.position}
        onChange={handleChangePosition}
        enum={[
          { value: "static", label: "Static" },
          { value: "relative", label: "Relative" },
          { value: "absolute", label: "Absolute" },
          { value: "fixed", label: "Fixed" },
          { value: "sticky", label: "Sticky" },
        ]}
        showCount={5}
        fontSize={7}
      />
      {openInset && (
        <Inset
          key={`${formKey}-${openInset as string}`}
          position={formDataRef.current.__position?.position}
        />
      )}

      <FormFlexBox>
        <FormStyleControl title="z-index" width="100%">
          <CSSVariableBadge keyofUsage="zIndex" syntax={["number"]}>
            <Input
              type="number"
              value={extractFormData(formDataRef.current).zIndex ?? ""}
              onChange={handleChangeZIndex}
              sx={{
                width: "100%",
              }}
            />
          </CSSVariableBadge>
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Float">
          <Select
            onChange={handleChange("float")}
            enum={[
              { value: "none", label: "None" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
            ]}
            value={extractFormData(formDataRef.current).float ?? "none"}
          />
        </FormStyleControl>
        <FormStyleControl title="Clear">
          <Select
            onChange={handleChange("clear")}
            enum={[
              { value: "none", label: "None" },
              { value: "left", label: "Left" },
              { value: "right", label: "Right" },
              { value: "both", label: "Both" },
            ]}
            value={extractFormData(formDataRef.current).clear ?? "none"}
          />
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};
