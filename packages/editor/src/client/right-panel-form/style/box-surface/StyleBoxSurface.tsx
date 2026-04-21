import {
  FormControl,
  FormFlexBox,
  FormLabelText,
  FormStyleControl,
} from "../../../forms/components";
import { Border } from "./Border";
import { BorderRadius } from "./BorderRadius";
import { BoxShadow } from "./BoxShadow";
import { Outline } from "./Outline";
import {
  BorderOutlineContext,
  useBorderOutlineContext,
} from "./BorderOutlineContext";
import { SliderLengthInput } from "../../../forms/components/SliderLengthInput";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { useStyleForm } from "../use-style-form";
import { useEffect, useState } from "react";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";

const StyleBoxSurfaceContent = () => {
  const { shouldShowBorderRadius } = useBorderOutlineContext();
  const { formDataRef, updateFormData } = useStyleForm();
  const [valueOpacity, setValueOpacity] = useState<string>("100");

  const handleChange = (value: string | undefined) => {
    setValueOpacity(`${value}`);

    const parsedValue = parseFloat(`${value || `100`}`) / 100;
    updateFormData({
      opacity: parsedValue === 1 ? undefined : `${parsedValue}`,
    });
  };

  useEffect(() => {
    const currentOpacity = formDataRef.current.opacity;
    setValueOpacity(`${parseFloat(String(currentOpacity || "1")) * 100}`);
  }, []);

  return (
    <>
      <Border />
      <Outline />

      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Radius" width="100%">
          <CSSVariableBadge keyofUsage="borderRadius" syntax={["universal"]}>
            <BorderRadius />
          </CSSVariableBadge>
        </FormStyleControl>
      </FormFlexBox>

      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Opacity" width="100%">
          <SliderLengthInput
            onChange={handleChange}
            value={valueOpacity}
            min={0}
            max={100}
            step={1}
            includeUnitsOnly={"%"}
            slotSxProps={{
              slider: {
                width: "75%",
                mr: 1,
              },
            }}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Box Shadow" width="100%">
          <CSSVariableBadge
            keyofUsage="boxShadow"
            syntax={["string", "universal"]}
            sx={{
              width: "100%",
            }}
          >
            <BoxShadow />
          </CSSVariableBadge>
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};

export const StyleBoxSurface = () => {
  return (
    <BorderOutlineContext>
      <StyleBoxSurfaceContent />
    </BorderOutlineContext>
  );
};
