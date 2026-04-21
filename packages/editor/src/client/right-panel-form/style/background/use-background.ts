import { useStyleForm } from "../use-style-form";
import type * as types from "../../../../types";
import { useEffect, useState } from "react";
import { backgroundValuesToCSSArray } from "../../../../lexical/styles/background";

export const useBackground = () => {
  //const context = useStyleBackgroundContext();
  const { formDataRef, updateFormData } = useStyleForm();
  const [values, setValues] = useState<
    types.CSSBackgroundImage[] | undefined
  >();

  const findValue = (index: number): types.CSSBackgroundImage | undefined => {
    if (!values) return undefined;
    return values[index];
  };

  const updateValues = (values: types.CSSBackgroundImage[]) => {
    setValues(values);
    updateFormData({
      __background: values,
      background: backgroundValuesToCSSArray(
        values,
        formDataRef.current.__backgroundGlobal
      ),
    });
  };

  const updateValue = (index: number, newValue: types.CSSBackgroundImage) => {
    if (!values) return;

    const updatedValues = [...values];
    updatedValues[index] = newValue;

    setValues(updatedValues);
    updateFormData({
      __background: updatedValues,
      background: backgroundValuesToCSSArray(
        updatedValues,
        formDataRef.current.__backgroundGlobal
      ),
    });
  };

  const addValue = (newValue: types.CSSBackgroundImage) => {
    const updatedValues = values ? [...values, newValue] : [newValue];
    setValues(updatedValues);
    updateFormData({
      __background: updatedValues,
      background: backgroundValuesToCSSArray(
        updatedValues,
        formDataRef.current.__backgroundGlobal
      ),
    });
  };

  const removeValue = (index: number) => {
    if (!values) return;

    const updatedValues = values.filter((_, i) => i !== index);
    setValues(updatedValues);
    updateFormData({
      __background: updatedValues,
      background: backgroundValuesToCSSArray(
        updatedValues,
        formDataRef.current.__backgroundGlobal
      ),
    });
  };

  useEffect(() => {
    const backgroundImage = formDataRef.current.__background as
      | types.CSSBackgroundImage[]
      | undefined;

    setValues(backgroundImage);
  }, [formDataRef.current.__background]);

  return {
    values,
    updateValues,
    findValue,
    updateValue,
    addValue,
    removeValue,
  };
};
