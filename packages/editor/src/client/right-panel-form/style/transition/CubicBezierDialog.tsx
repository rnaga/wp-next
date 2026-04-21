import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { CubicBezierEditor } from "../../../forms/cubic-bezier/CubicBezierEditor";
import { PresetCurves } from "../../../forms/cubic-bezier/PresetCurves";
import { AnimationPreview } from "../../../forms/cubic-bezier/AnimationPreview";
import { DEFAULT_TRANSITION_VALUE } from "../../../forms/cubic-bezier/bezier-utils";
import { SliderLengthInput } from "../../../forms/components/SliderLengthInput";
import { SelectTransitionType } from "../../../forms/cubic-bezier/SelectTransitionType";

import type * as types from "../../../../types";

interface CubicBezierDialogContextValue {
  open: boolean;
  onClose: () => void;
  onCancel: () => void;
  targetRef: React.RefObject<HTMLElement | null>;
}

const Context = createContext<CubicBezierDialogContextValue>({} as any);

export const useCubicBezierDialogContext = () => {
  return useContext(Context);
};

interface CubicBezierDialogProps {
  value: types.CSSTransitionValue | undefined;
  onChange: (value: types.CSSTransitionValue) => void;
  onClose?: () => void;
  onCancel?: () => void;
  disabled: boolean;
}

const WrapDraggableBox = ({
  value,
  onChange,
  onClose: onCloseProp,
  onCancel: onCancelProp,
}: CubicBezierDialogProps) => {
  const { onCancel, open, targetRef } = useCubicBezierDialogContext();
  const targetRefDraggable = useRef<HTMLElement | null>(null);

  const [tempValue, setTempValue] = useState<types.CSSTransitionValue>(
    value ?? DEFAULT_TRANSITION_VALUE
  );
  const [duration, setDuration] = useState<number>(
    value?.$duration ?? DEFAULT_TRANSITION_VALUE.$duration
  );
  const [transitionType, setTransitionType] = useState<string>(
    value?.$type ?? DEFAULT_TRANSITION_VALUE.$type
  );

  // Sync tempValue with value prop when dialog opens
  useEffect(() => {
    if (open) {
      const currentValue = value ?? DEFAULT_TRANSITION_VALUE;
      setTempValue(currentValue);
      setDuration(currentValue.$duration);
      setTransitionType(currentValue.$type);
    }
  }, [open, value]);

  const handleBezierChange = (bezier: types.BezierCurve) => {
    setTempValue({
      ...tempValue,
      $cubicBezier: bezier,
    });
  };

  const handleApply = () => {
    onChange({
      ...tempValue,
      $duration: duration,
      $type: transitionType,
    });
    onCloseProp?.();
    onCancel();
  };

  const handleCancel = () => {
    const currentValue = value ?? DEFAULT_TRANSITION_VALUE;
    setTempValue(currentValue); // Reset to original value
    setDuration(currentValue.$duration);
    setTransitionType(currentValue.$type);
    onCancelProp?.();
    onCancel();
  };

  return (
    <DraggableBox
      open={open}
      onClose={handleCancel}
      targetRef={targetRef}
      ref={targetRefDraggable}
      title="Cubic Bezier Editor"
    >
      <Box
        sx={{
          width: 520,
          maxHeight: "95dvh",
          overflowY: "auto",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          p: 2,
          gap: 2,
        }}
      >
        {/* Main Content Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "170px 1fr",
            gap: 2,
          }}
        >
          {/* Left Column - Preset Curves */}
          <Box sx={{ minWidth: 0 }}>
            <PresetCurves
              value={tempValue.$cubicBezier}
              onChange={handleBezierChange}
            />
          </Box>

          {/* Right Column - Editor and Preview */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              minWidth: 0,
            }}
          >
            {/* Main Editor */}
            <CubicBezierEditor
              value={tempValue.$cubicBezier}
              onChange={handleBezierChange}
            />

            {/* Animation Preview */}
            <AnimationPreview
              value={tempValue.$cubicBezier}
              duration={duration}
            />

            {/* Transition Type */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Typography fontSize={10} bold>
                Transition Type
              </Typography>
              <SelectTransitionType
                onChange={setTransitionType}
                defaultValue={transitionType}
                size="small"
              />
            </Box>

            {/* Duration Control */}
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
              }}
            >
              <Typography fontSize={10} bold>
                Duration
              </Typography>
              <SliderLengthInput
                value={`${duration}ms`}
                onChange={(value) => {
                  if (!value) return;
                  const numValue = parseInt(value);
                  if (!isNaN(numValue)) {
                    setDuration(numValue);
                  }
                }}
                min={100}
                max={5000}
                step={100}
                size="small"
                includeUnits={["ms"]}
              />
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box
          sx={{
            display: "flex",
            gap: 1,
            pt: 1,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Button
            size="small"
            onClick={handleCancel}
            variant="outlined"
            sx={{ flex: 1 }}
          >
            <Typography fontSize={10}>Cancel</Typography>
          </Button>
          <Button size="small" onClick={handleApply} sx={{ flex: 1 }}>
            <Typography fontSize={10}>Apply</Typography>
          </Button>
        </Box>
      </Box>
    </DraggableBox>
  );
};

export const CubicBezierDialog = (props: CubicBezierDialogProps) => {
  const { disabled } = props;
  const targetRef = useRef<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <Context
      value={{
        onClose: handleClose,
        onCancel: handleCancel,
        open,
        targetRef,
      }}
    >
      <WrapDraggableBox {...props} />

      <Button
        disabled={disabled}
        ref={targetRef as any}
        size="small"
        onClick={() => setOpen(true)}
        sx={{
          width: "100%",
        }}
      >
        <Typography fontSize={10}>Add Transition</Typography>
      </Button>
    </Context>
  );
};
