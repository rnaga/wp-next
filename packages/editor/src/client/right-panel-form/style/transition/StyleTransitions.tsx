import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { SortableList } from "@rnaga/wp-next-ui/SortableList";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useSelectedNode } from "../../../global-event";
import { useStyleForm } from "../use-style-form";

import type * as types from "../../../../types";
import { CubicBezierDialog } from "../../../forms/cubic-bezier";
import { useElementState } from "../../ElementStateContext";
import { HelpText } from "../../../forms/components/HelpText";
import { transitionValuesToCSSArray } from "../../../../lexical/styles/transition";

const Context = createContext<{
  values: types.CSSTransitionValue[];
  setValues: (values: types.CSSTransitionValue[]) => void;
}>({} as any);

export const StyleTransitions = () => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const { formDataRef, updateFormData, savePrevValue, getPrevValue } =
    useStyleForm();
  const { elementState } = useElementState();

  const [values, setValues] = useState<types.CSSTransitionValue[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentValue = selectedIndex >= 0 ? values[selectedIndex] : undefined;

  const updateValue = (newValue: types.CSSTransitionValue | undefined) => {
    const currentValues = formDataRef.current.__transition as
      | types.CSSTransitionValue[]
      | undefined;

    const newValues = (
      selectedIndex < 0
        ? [...(currentValues ?? []), newValue] // Append new value
        : (currentValues?.map((v, i) => (i === selectedIndex ? newValue : v)) ??
          [])
    ).filter((v) => !!v); // Update existing value

    updateFormData({
      __transition: newValues,
      transition: transitionValuesToCSSArray(newValues)?.join(", "),
    });

    setValues(newValues);
  };

  // Save previous value when opening an existing transition for editing
  useEffect(() => {
    if (selectedIndex < 0 || !selectedNode) {
      return;
    }

    savePrevValue((css) => {
      const prevValue = css.__transition as
        | types.CSSTransitionValue[]
        | undefined;

      return {
        transition:
          Array.isArray(prevValue) && prevValue.length > 0
            ? prevValue
            : undefined,
      };
    });
  }, [selectedIndex, selectedNode, savePrevValue]);

  const handleChange = (newValue: types.CSSTransitionValue) => {
    updateValue(newValue);
    setSelectedIndex(-1); // Reset selected index after applying changes
  };

  const handleCancel = () => {
    // Restore the saved value if it exists
    const prevValue = getPrevValue("transition");
    if (prevValue && Array.isArray(prevValue) && prevValue.length > 0) {
      updateFormData({
        __transition: prevValue,
        transition: transitionValuesToCSSArray(prevValue)?.join(", "),
      });

      setValues(prevValue);
    }
    setSelectedIndex(-1); // Reset selected index after canceling
  };

  const handleEdit = (index: number) => {
    setSelectedIndex(index);
    // Trigger the CubicBezierDialog button click after state update
    setTimeout(() => {
      const button = buttonRef.current?.querySelector("button");
      button?.click();
    }, 0);
  };

  const handleDelete = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    updateFormData({
      __transition: newValues,
      transition: transitionValuesToCSSArray(newValues)?.join(", "),
    });

    setValues(newValues);
    setSelectedIndex(-1); // Reset selected index after deletion
  };

  const handleChangeOrder = (newValues: types.CSSTransitionValue[]) => {
    updateFormData({
      __transition: newValues,
      transition: transitionValuesToCSSArray(newValues)?.join(", "),
    });
    setValues(newValues);
  };

  useEffect(() => {
    if (!selectedNode) {
      return;
    }

    const newValues = editor.read(() => selectedNode.getLatest()).__css.get()
      ?.__transition as types.CSSTransitionValue[] | undefined;

    if (newValues && Array.isArray(newValues)) {
      setValues(newValues);
    } else {
      setValues([]);
    }
  }, [selectedNode]);

  return (
    <Context value={{ values, setValues }}>
      <Box
        sx={{
          width: "100%",
        }}
      >
        <Box ref={buttonRef as any}>
          <CubicBezierDialog
            value={currentValue}
            onChange={handleChange}
            onCancel={handleCancel}
            disabled={elementState !== "none"}
          />
        </Box>
        {values.length > 0 && (
          <Box sx={{ mt: 1 }}>
            <SortableList
              enum={values.map((value) => ({
                value,
                label: `${value.$type} ${value.$duration}ms`,
              }))}
              displayType="vertical"
              size="small"
              onChange={(newValues) => {
                handleChangeOrder(newValues.map((v) => v.value));
              }}
              onEdit={handleEdit}
              onDelete={handleDelete}
              renderItem={(item) => (
                <Box
                  sx={{
                    flexGrow: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 2,
                  }}
                >
                  <Typography>{item.value.$type}</Typography>
                  <HelpText>{item.value.$duration}ms</HelpText>
                </Box>
              )}
            />
          </Box>
        )}
      </Box>
    </Context>
  );
};
