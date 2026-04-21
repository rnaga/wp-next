import { createContext, useContext, useEffect, useRef, useState } from "react";

import { Box, FormControl } from "@mui/material";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { InputColor } from "@rnaga/wp-next-ui/InputColor";

import { FormLabelText } from "../../../forms/components";
import { ButtonGroup } from "../../../forms/components/ButtonGroup";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";
import { useStyleForm } from "../use-style-form";
import { BackgroundImage } from "./BackgroundImage";
import { LinearGradient } from "./LinearGradient";
import { RadialGradient } from "./RadialGradient";
import { Url } from "./Url";
import { useBackground } from "./use-background";

import type * as types from "../../../../types";
import { Select } from "@rnaga/wp-next-ui/Select";
import { backgroundValuesToCSSArray } from "../../../../lexical/styles/background";

const Context = createContext<{
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  onOpen: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  itemIndex?: number;
  targetRef: React.RefObject<HTMLElement | null>;
}>({} as any);

export const useStyleBackgroundContext = () => {
  return useContext(Context);
};

const WrapDraggableBox = () => {
  const { onCancel, open, targetRef } = useStyleBackgroundContext();

  const targetRefDraggable = useRef<HTMLElement | null>(null);

  const { itemIndex: index } = useStyleBackgroundContext();
  const { values, findValue } = useBackground();

  const [valueType, setValueType] =
    useState<types.CSSBackgroundImageType>("url");

  const handleChange = (value: string | undefined) => {
    setValueType(value as types.CSSBackgroundImageType);
  };

  useEffect(() => {
    if (index === undefined) return;
    const value = findValue(index);
    if (value) {
      setValueType(value.$type as types.CSSBackgroundImageType);
    }
  }, [index, values]);

  return (
    <>
      <DraggableBox
        open={open}
        onClose={onCancel}
        targetRef={targetRef}
        ref={targetRefDraggable}
        title="Background"
      >
        <Box
          sx={{
            width: 300,
            maxHeight: "95dvh",
            overflowY: "auto",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            p: 1,
          }}
        >
          <ButtonGroup
            value={valueType}
            onChange={handleChange}
            enum={[
              { value: "url", label: "URL" },
              { value: "linear-gradient", label: "Linear Gradient" },
              { value: "radial-gradient", label: "Radial Gradient" },
            ]}
            fontSize={9}
            showCount={4}
          />
          {valueType == "url" && <Url />}
          {valueType === "linear-gradient" && <LinearGradient />}
          {valueType === "radial-gradient" && <RadialGradient />}
        </Box>
      </DraggableBox>
    </>
  );
};

export const StyleBackground = () => {
  const { formDataRef, updateFormData, getPrevValue, savePrevValue, formKey } =
    useStyleForm();
  const targetRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const { removeValue } = useBackground();
  const [index, setIndex] = useState<number | undefined>(undefined);

  const handleEdit = (index: number) => {
    setIndex(index);
    setOpen(true);
  };

  const handleDelete = (index: number) => {
    removeValue(index);
    setIndex(undefined);
  };

  const handleClose = () => {
    setOpen(false);
    setIndex(undefined);
  };

  const handleChangeGlobal = (value: types.CSSBackgroundGlobal) => {
    const backgroundGlobal = {
      ...formDataRef.current.__backgroundGlobal,
      ...value,
    };
    const background = backgroundValuesToCSSArray(
      formDataRef.current.__background,
      backgroundGlobal
    );

    updateFormData({
      background,
      __backgroundGlobal: backgroundGlobal,
    });
  };

  const handleCancel = () => {
    // Restore the saved value if it exists
    const prevValue = getPrevValue("background");
    if (
      prevValue &&
      Array.isArray(prevValue.__background) &&
      prevValue.__background.length > 0
    ) {
      updateFormData({
        __background: prevValue.__background,
        background: prevValue.background,
      });
    }

    setOpen(false);
    setIndex(undefined);
  };

  useEffect(() => {
    // Save the current background values when the component mounts
    savePrevValue((css) => ({
      background: {
        __background: css.__background,
        background: css.background,
      },
    }));
  }, [open]);

  return (
    <Context
      value={{
        onClose: handleClose,
        onCancel: handleCancel,
        onOpen: () => setOpen(true),
        onEdit: handleEdit,
        onDelete: handleDelete,
        itemIndex: index,
        open,
        targetRef,
      }}
    >
      <WrapDraggableBox />

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
        }}
      >
        <CSSVariableBadge
          keyofUsage="background"
          syntax={["universal"]}
          sx={{
            width: "100%",
          }}
        >
          <BackgroundImage />
        </CSSVariableBadge>

        <FormControl fullWidth>
          <FormLabelText label="Background Color" />
          <CSSVariableBadge
            keyofUsage="backgroundColor"
            syntax={["color", "universal"]}
          >
            <InputColor
              size="small"
              key={`${formKey}-backgroundColor`}
              canClear
              value={
                formDataRef.current.__backgroundGlobal?.$backgroundColor ?? ""
              }
              onChange={(color) => {
                handleChangeGlobal({
                  $backgroundColor: color,
                });
              }}
              onClear={() => {
                handleChangeGlobal({
                  $backgroundColor: undefined,
                });
              }}
              sx={{
                width: "100%",
              }}
            />
          </CSSVariableBadge>
        </FormControl>

        <FormControl fullWidth>
          <FormLabelText label="Background Clip" />
          <Select
            size="small"
            value={formDataRef.current.__backgroundGlobal?.$clip ?? undefined}
            onChange={(value) => {
              handleChangeGlobal({
                $clip: value as types.CSSBackgroundGlobal["$clip"],
              });
            }}
            enum={[
              { value: undefined, label: "Default" },
              { value: "border-box", label: "Border Box" },
              { value: "padding-box", label: "Padding Box" },
              { value: "content-box", label: "Content Box" },
              { value: "text", label: "Text" },
              { value: "border-area", label: "Border Area" },
            ]}
          />
        </FormControl>
      </Box>
    </Context>
  );
};
