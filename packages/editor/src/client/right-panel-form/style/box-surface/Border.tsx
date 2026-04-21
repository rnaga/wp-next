import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
// import CropPin and CropFree icons from Material UI
import CropDinIcon from "@mui/icons-material/CropDin";
import CropFreeIcon from "@mui/icons-material/CropFree";
import { Box, FormControl } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { InputClickField } from "@rnaga/wp-next-ui/InputClickField";
import { InputColor } from "@rnaga/wp-next-ui/InputColor";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Tabs } from "@rnaga/wp-next-ui/Tabs";

import { trackEventEnd } from "../../../event-utils";
import {
  ButtonGroup,
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
  borderDefaultValue,
  borderValueToCSS,
  borderValueToString,
} from "../../../../lexical/styles/box-surface";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";

const Context = createContext<{
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  targetRef: React.RefObject<HTMLElement | null>;
  updateValue: (value: types.CSSBorder) => void;
  resetValue: () => void;
  value: types.CSSBorder | undefined;
}>({} as any);

const Value = <T extends "all" | "individual">(props: {
  type: T;
  sideType?: T extends "all" ? never : "$top" | "$right" | "$bottom" | "$left";
}) => {
  const { type, sideType } = props;
  const { updateValue, value } = useContext(Context);

  const handleChange = <T extends keyof types.CSSBorderValue>(
    key: T,
    borderValue: types.CSSBorderValue[T]
  ) => {
    // If the width is being set to 0 or parses to 0, unset the entire border value
    if (key === "$width" && parseFloat(borderValue as string) === 0) {
      if (type === "all") {
        updateValue({
          ...value,
          $type: "all",
          $all: undefined,
        });
      } else {
        updateValue({
          ...value,
          $type: "individual",
          [sideType!]: undefined,
        });
      }
      return;
    }

    if (type === "all") {
      updateValue({
        ...value,
        $type: "all",
        $all: {
          ...value?.$all,
          [key]: borderValue,
        },
      });
      return;
    }

    updateValue({
      ...value,
      $type: "individual",
      [sideType!]: {
        ...value?.[sideType!],
        [key]: borderValue,
      },
    });
  };

  const { color, style, width } = useMemo(() => {
    const borderValue = type === "all" ? value?.$all : value?.[sideType!];

    return {
      color: borderValue?.$color,
      style: borderValue?.$style,
      width: borderValue?.$width,
    };
  }, [type, value, sideType]);

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
          value={color ?? borderDefaultValue.$color}
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
          value={style ?? borderDefaultValue.$style}
          onChange={(s) =>
            handleChange("$style", s as types.CSSBorderValue["$style"])
          }
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
  const [type, setType] = useState<"all" | "individual">("all");
  const { selectedNode } = useSelectedNode();

  useEffect(() => {
    savePrevValue((css) => ({
      border: css.__border,
    }));
  }, [selectedNode, open]);

  // Sync the button group selection with the stored value's $type when the panel opens.
  useEffect(() => {
    if (open) {
      setType(value?.$type ?? "all");
    }
  }, [open]);

  const handleChangeType = (type: "all" | "individual") => {
    setType(type);
    trackEventEnd(
      "border-type-change",
      () => {
        updateValue({
          ...value,
          $type: type,
        });
      },
      20
    );
  };

  const handleSubmit = () => {
    onClose();
  };

  const handleCancel = () => {
    // Restore the saved value if it exists
    const prevValue = getPrevValue("border");
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
        title="Border"
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
          <FormFlexBox>
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
                  tooltip: "All sides",
                  label: <CropDinIcon sx={{ fontSize: 16 }} />,
                },
                {
                  value: "individual",
                  tooltip: "Individual",
                  label: <CropFreeIcon sx={{ fontSize: 16 }} />,
                },
              ]}
              onChange={(value) => {
                handleChangeType(value as "all" | "individual");
              }}
              value={type}
            />
          </FormFlexBox>

          {type === "all" ? (
            <Value type="all" />
          ) : (
            <Tabs
              items={[
                {
                  label: "Top",
                  content: <Value type="individual" sideType="$top" />,
                },
                {
                  label: "Right",
                  content: <Value type="individual" sideType="$right" />,
                },
                {
                  label: "Bottom",
                  content: <Value type="individual" sideType="$bottom" />,
                },
                {
                  label: "Left",
                  content: <Value type="individual" sideType="$left" />,
                },
              ]}
              size="small"
            />
          )}
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

export const Border = () => {
  const { selectedNode } = useSelectedNode();
  const { updateFormData } = useStyleForm();
  const { borderValue, setBorderValue } = useBorderOutlineContext();
  const [open, setOpen] = useState(false);
  const targetRef = useRef<HTMLElement | null>(null);

  const handleClear = () => {
    updateFormData({
      border: undefined,
      borderTop: undefined,
      borderRight: undefined,
      borderBottom: undefined,
      borderLeft: undefined,
      __border: undefined,
    });

    setBorderValue(undefined);
  };

  const updateValue = (value: types.CSSBorder) => {
    setBorderValue(value);

    // borderValueToCSS returns kebab-case keys (e.g. "border-bottom") which are
    // correct for final CSS output, but updateFormData expects camelCase CSSProperties
    // keys. Remap before storing.
    const css = borderValueToCSS(value);
    updateFormData({
      __border: value,
      border: css?.border,
      borderTop: css?.["border-top"],
      borderRight: css?.["border-right"],
      borderBottom: css?.["border-bottom"],
      borderLeft: css?.["border-left"],
    });
  };

  const borderLabel = useMemo(
    () => borderValueToString(borderValue),
    [borderValue]
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
        value: borderValue,
      }}
    >
      <WrapDraggableBox />
      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Border" width="100%">
          <CSSVariableBadge keyofUsage="border" syntax={["universal"]}>
            <InputClickField
              canClear
              ref={targetRef}
              label={borderLabel ?? "No border set"}
              value={borderLabel ?? undefined}
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
