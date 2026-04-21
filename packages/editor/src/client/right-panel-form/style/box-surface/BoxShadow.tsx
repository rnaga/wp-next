import { createContext, useContext, useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, FormControl } from "@mui/material";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { InputColor } from "@rnaga/wp-next-ui/InputColor";
import { SortableList } from "@rnaga/wp-next-ui/SortableList";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { trackEventEnd } from "../../../event-utils";
import { ButtonGroup, FormLabelText } from "../../../forms/components";
import { Button } from "@rnaga/wp-next-ui/Button";
import { SliderLengthInput } from "../../../forms/components/SliderLengthInput";
import { useSelectedNode } from "../../../global-event";
import { useStyleForm } from "../use-style-form";

import type * as types from "../../../../types";
import { boxShadowValuesToCSSArray } from "../../../../lexical/styles/box-surface";

const sliderSlotSxProps = {
  slider: {
    width: "75%",
  },
  lengthInput: {
    width: "25%",
  },
};

const OffsetSliderLengthInput = (props: {
  value: string;
  onChange: (value: string | undefined) => void;
}) => {
  const { value, onChange } = props;
  return (
    <SliderLengthInput
      onChange={onChange}
      value={value}
      min={-50}
      max={50}
      step={1}
      excludeUnits={["%", "auto"]}
      slotSxProps={sliderSlotSxProps}
    />
  );
};

const defaultValue: types.CSSBoxShadowValue = {
  position: "outset", // In CSS, the default is 'outset' (i.e., not 'inset')
  offsetX: "0px",
  offsetY: "0px",
  blurRadius: "0px",
  size: "0px", // Optional, can be omitted
  color: "",
};

const Context = createContext<{
  values: types.CSSBoxShadowValue[];
  setValues: (values: types.CSSBoxShadowValue[]) => void;
}>({} as any);

const WrapDraggableBox = (props: {
  index: number;
  open: boolean;
  onClose: VoidFunction;
  targetRef: React.RefObject<HTMLElement | null>;
}) => {
  const { formDataRef, updateFormData, savePrevValue, getPrevValue } =
    useStyleForm();
  const { open, onClose, targetRef, index } = props;
  const { selectedNode } = useSelectedNode();
  const { setValues } = useContext(Context);

  const [value, setValue] = useState<types.CSSBoxShadowValue>(defaultValue);

  const updateValue = (newValue: types.CSSBoxShadowValue | undefined) => {
    const values = formDataRef.current.__boxShadow as
      | types.CSSBoxShadowValue[]
      | undefined;

    const newValues = (
      0 > index
        ? [...(values ?? []), newValue] // Append new value
        : (values?.map((v, i) => (i === index ? newValue : v)) ?? [])
    ).filter((v) => !!v); // Update existing value

    updateFormData({
      __boxShadow: newValues,
      boxShadow: boxShadowValuesToCSSArray(newValues),
    });

    setValues(newValues);
  };

  useEffect(() => {
    const newValues = formDataRef.current
      .__boxShadow as types.CSSBoxShadowValue[];
    if (!newValues || 0 >= newValues.length || 0 > index) {
      return;
    }

    const newValue = newValues[index];
    if (!newValue) {
      return;
    }

    setValue(newValue);
  }, [index, open]);

  // When the component mounts or the index changes, we check if we have a saved value
  // If the index is -1, it means we are adding a new value, so we don't need to set a saved value
  // If the index is valid, we retrieve the saved value from the selected node's CSS
  useEffect(() => {
    if (0 > index || !open || !selectedNode) {
      savePrevValue(() => ({
        boxShadow: undefined,
      }));
      return;
    }

    savePrevValue((css) => {
      const prevValue = css.__boxShadow as
        | types.CSSBoxShadowValue[]
        | undefined;

      return {
        boxShadow:
          Array.isArray(prevValue) && prevValue.length >= 0
            ? prevValue
            : undefined,
      };
    });
  }, [index, open]);

  const handleChange = (v: Partial<types.CSSBoxShadowValue>) => {
    trackEventEnd(
      "box-shadow-change",
      () => {
        const newValue = {
          ...value,
          ...v,
        };

        setValue(newValue);
        if (index >= 0) {
          // Update the form data with the new value
          updateValue(newValue);
        }
      },
      20,
      { counter: 1 }
    );
  };

  const handleSubmit = () => {
    updateValue(value);
    setValue(defaultValue); // Reset the value to default after submission
    onClose();
  };

  const handleCancel = () => {
    // Restore the saved value if it exists
    const prevValue = getPrevValue("boxShadow");
    if (prevValue && Array.isArray(prevValue) && prevValue.length > 0) {
      updateFormData({
        __boxShadow: prevValue,
        boxShadow: boxShadowValuesToCSSArray(prevValue),
      });

      setValues(prevValue);
    }

    // Reset the value to the original one
    setValue(defaultValue);

    onClose();
  };

  return (
    <DraggableBox
      open={open}
      onClose={handleCancel}
      targetRef={targetRef}
      title="Box Shadow"
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          mb: 1.5,
          mx: 1,
          gap: 1,
        }}
      >
        <FormControl fullWidth>
          <FormLabelText label="Position" />
          <ButtonGroup
            enum={[
              { value: "outset", label: "Outset" },
              { value: "inset", label: "Inset" },
            ]}
            value={value.position}
            onChange={(newValue) => {
              handleChange({
                position: newValue as types.CSSBoxShadowValue["position"],
              });
            }}
            slotSxProps={{
              buttonLabel: {
                fontSize: 10,
                textTransform: "none",
              },
            }}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabelText label="X Offset" />
          <OffsetSliderLengthInput
            value={value.offsetX}
            onChange={(newValue) => {
              if (!newValue) {
                return;
              }

              handleChange({
                offsetX: newValue,
              });
            }}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabelText label="Y Offset" />
          <OffsetSliderLengthInput
            value={value.offsetY}
            onChange={(newValue) => {
              if (!newValue) {
                return;
              }

              handleChange({
                offsetY: newValue,
              });
            }}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabelText label="Blur Radius" />
          <SliderLengthInput
            onChange={(newValue) => {
              if (!newValue) {
                return;
              }

              handleChange({
                blurRadius: newValue,
              });
            }}
            value={value.blurRadius}
            min={0}
            max={50}
            step={1}
            excludeUnits={["%", "auto"]}
            slotSxProps={sliderSlotSxProps}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabelText label="Size" />
          <SliderLengthInput
            onChange={(newValue) => {
              if (!newValue) {
                return;
              }

              handleChange({
                size: newValue,
              });
            }}
            value={value.size ?? "0px"}
            min={0}
            max={50}
            step={1}
            excludeUnits={["%", "auto"]}
            slotSxProps={sliderSlotSxProps}
          />
        </FormControl>
        <FormControl fullWidth>
          <FormLabelText label="Color" />
          <InputColor
            value={value.color}
            canClear
            onClear={() => {
              handleChange({
                color: "",
              });
            }}
            onChange={(newValue) => {
              if (!newValue) {
                return;
              }

              handleChange({
                color: newValue,
              });
            }}
          />
        </FormControl>
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
      </Box>
    </DraggableBox>
  );
};

export const BoxShadow = () => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const { formDataRef, updateFormData } = useStyleForm();
  const [open, setOpen] = useState(false);

  const targetRef = useRef<HTMLElement | null>(null);

  const [values, setValues] = useState<types.CSSBoxShadowValue[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const handleClose = () => {
    setOpen(false);
  };

  const handleEdit = (index: number) => {
    setSelectedIndex(index);
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    updateFormData({
      __boxShadow: newValues,
      boxShadow: boxShadowValuesToCSSArray(newValues),
    });

    setValues(newValues);
  };

  const handleChangeOrder = (newValues: types.CSSBoxShadowValue[]) => {
    updateFormData({
      __boxShadow: newValues,
      boxShadow: boxShadowValuesToCSSArray(newValues),
    });
    setValues(newValues);
  };

  useEffect(() => {
    if (!selectedNode) {
      return;
    }

    const newValues = editor.read(() => selectedNode.getLatest()).__css.get()
      ?.__boxShadow as types.CSSBoxShadowValue[] | undefined;

    if (newValues && Array.isArray(newValues)) {
      setValues(newValues);
    } else {
      setValues([]);
    }
  }, [selectedNode]);

  return (
    <Context value={{ values, setValues }}>
      <WrapDraggableBox
        open={open}
        onClose={handleClose}
        targetRef={targetRef}
        index={selectedIndex}
      />
      <Box
        sx={{
          width: "100%",
        }}
      >
        <Button
          ref={targetRef as any}
          size="small"
          onClick={() => {
            setSelectedIndex(-1);
            setOpen(true);
          }}
          sx={{
            width: "100%",
          }}
        >
          <Typography fontSize={10}>Add Box Shadow</Typography>
        </Button>
        {values.length > 0 && (
          <SortableList
            enum={values.map((value, index) => ({
              value,
              label: `${value.offsetX} ${value.offsetY} ${value.blurRadius}`,
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
                  py: 0.5,
                  px: 1,
                }}
              >
                <Typography>{item.label}</Typography>
                {item.value.color && (
                  <Box
                    sx={{
                      width: 12,
                      height: 12,
                      backgroundColor: item.value.color,
                      ml: 1,
                    }}
                  />
                )}
              </Box>
            )}
          />
        )}
      </Box>
    </Context>
  );
};
