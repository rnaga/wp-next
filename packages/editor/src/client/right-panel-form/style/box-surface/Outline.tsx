import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, FormControl } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { InputClickField } from "@rnaga/wp-next-ui/InputClickField";
import { InputColor } from "@rnaga/wp-next-ui/InputColor";
import { Select } from "@rnaga/wp-next-ui/Select";

import { trackEventEnd } from "../../../event-utils";
import {
  FormFlexBox,
  FormLabelText,
  FormStyleControl,
} from "../../../forms/components";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { useSelectedNode } from "../../../global-event";
import { useStyleForm } from "../use-style-form";
import { useBorderOutlineContext } from "./BorderOutlineContext";

import type * as types from "../../../../types";
import {
  outlineDefaultValue,
  outlineValueToCSS,
  outlineValueToString,
} from "../../../../lexical/styles/box-surface";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";

const Context = createContext<{
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  targetRef: React.RefObject<HTMLElement | null>;
  updateValue: (value: types.CSSOutlineValue) => void;
  resetValue: () => void;
  value: types.CSSOutlineValue | undefined;
}>({} as any);

const Value = () => {
  const { updateValue, value } = useContext(Context);

  const handleChange = <T extends keyof types.CSSOutlineValue>(
    key: T,
    outlineValue: types.CSSOutlineValue[T]
  ) => {
    // If the width is being set to 0 or parses to 0, unset the entire outline value
    if (key === "$width" && parseFloat(outlineValue as string) === 0) {
      updateValue({
        ...outlineDefaultValue,
        $width: "0px",
      });
      return;
    }

    updateValue({
      ...outlineDefaultValue,
      ...value,
      [key]: outlineValue,
    });
  };

  const { color, style, width, offset } = useMemo(() => {
    return {
      color: value?.$color,
      style: value?.$style,
      width: value?.$width,
      offset: value?.$offset,
    };
  }, [value]);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 1,
        mt: 1,
      }}
    >
      <FormControl fullWidth>
        <FormLabelText label="Width" />
        <StyleLengthInput
          value={width ?? "0px"}
          onChange={(w) => handleChange("$width", w)}
          min={0}
          excludeUnits={["%", "auto"]}
        />
      </FormControl>
      <FormControl fullWidth>
        <FormLabelText label="Color" />
        <InputColor
          readOnly={parseInt(width ?? "0") === 0}
          value={color ?? outlineDefaultValue.$color}
          onChange={(c) => handleChange("$color", c)}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabelText label="Style" />
        <Select
          readOnly={parseInt(width ?? "0") === 0}
          enum={[
            { value: "solid", label: "Solid" },
            { value: "dashed", label: "Dashed" },
            { value: "dotted", label: "Dotted" },
            { value: "double", label: "Double" },
            { value: "groove", label: "Groove" },
            { value: "ridge", label: "Ridge" },
            { value: "inset", label: "Inset" },
            { value: "outset", label: "Outset" },
          ]}
          value={style ?? outlineDefaultValue.$style}
          onChange={(s) =>
            handleChange("$style", s as types.CSSOutlineValue["$style"])
          }
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabelText label="Offset" />
        <StyleLengthInput
          value={offset ?? "0px"}
          onChange={(o) => handleChange("$offset", o ?? "0px")}
          min={0}
          excludeUnits={["%", "auto"]}
        />
      </FormControl>
    </Box>
  );
};

const WrapDraggableBox = () => {
  const { onCancel, open, targetRef, updateValue, value, onClose, resetValue } =
    useContext(Context);
  const targetRefDraggable = useRef<HTMLElement | null>(null);
  const { savePrevValue, getPrevValue } = useStyleForm();
  const { selectedNode } = useSelectedNode();

  useEffect(() => {
    savePrevValue((css) => ({
      outline: css.__outline,
    }));
  }, [selectedNode, open]);

  const handleSubmit = () => {
    onClose();
  };

  const handleCancel = () => {
    // Restore the saved value if it exists
    const prevValue = getPrevValue("outline");
    prevValue ? updateValue(prevValue) : resetValue();

    onClose();
  };

  return (
    <>
      <DraggableBox
        open={open}
        onClose={onCancel}
        targetRef={targetRef}
        ref={targetRefDraggable}
        title="Outline"
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
          <Value />
        </Box>
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
      </DraggableBox>
    </>
  );
};

export const Outline = () => {
  const { selectedNode } = useSelectedNode();
  const { updateFormData } = useStyleForm();
  const { outlineValue, setOutlineValue } = useBorderOutlineContext();
  const [open, setOpen] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  const handleClear = () => {
    updateFormData({
      outline: undefined,
      outlineOffset: undefined,
      __outline: undefined,
    });

    setOutlineValue(undefined);
  };

  const updateValue = (value: types.CSSOutlineValue) => {
    setOutlineValue(value);

    updateFormData({
      __outline: value,
      ...outlineValueToCSS(value),
    });
  };

  const outlineLabel = useMemo(
    () => outlineValueToString(outlineValue),
    [outlineValue]
  );

  return (
    <Context
      value={{
        open,
        onClose: () => setOpen(false),
        onCancel: () => setOpen(false),
        targetRef,
        updateValue,
        resetValue: () => handleClear(),
        value: outlineValue,
      }}
    >
      <WrapDraggableBox />
      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Outline" width="100%">
          <CSSVariableBadge keyofUsage="outline" syntax={["universal"]}>
            <InputClickField
              canClear
              ref={targetRef}
              label={outlineLabel ?? "No outline set"}
              value={outlineLabel ?? undefined}
              onClick={(e) => {
                setOpen(true);
              }}
              sx={{
                width: "100%",
              }}
              onClear={handleClear}
            />
          </CSSVariableBadge>
        </FormStyleControl>
      </FormFlexBox>
    </Context>
  );
};
