import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

import { Box, IconButton, SxProps, Tooltip } from "@mui/material";
import NorthIcon from "@mui/icons-material/North";
import EastIcon from "@mui/icons-material/East";
import SouthIcon from "@mui/icons-material/South";
import WestIcon from "@mui/icons-material/West";

import { Input } from "@rnaga/wp-next-ui/Input";

import { StyleMouseInput } from "../../../forms/components";
import {
  createExtractFormData,
  cssPositionValueToJson,
  jsonToCssPositionValue,
  parseCssValue,
  positionToCssValue,
} from "../../../forms/utils";
import { useStyleForm } from "../use-style-form";

import type * as types from "../../../../types";

const Context = createContext<{
  updatePositionValues: (
    newValues: types.CSSPositionValues | undefined
  ) => void;
}>({} as any);

const PositionBox = (props: {
  position:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top"
    | "right"
    | "bottom"
    | "left";
}) => {
  const { position } = props;

  const { formDataRef, updateFormData } = useStyleForm();
  // const { setCSSPositionValues } = useContext(Context);
  const { updatePositionValues } = useContext(Context);

  const handleClick = () => {
    let newCSSPositionValues: types.CSSPositionValues;

    switch (position) {
      case "top-left":
        newCSSPositionValues = {
          top: { value: "0", unit: "%" },
          left: { value: "0", unit: "%" },
          right: { value: "auto", unit: null },
          bottom: { value: "auto", unit: null },
        };
        break;
      case "top-right":
        newCSSPositionValues = {
          top: { value: "0", unit: "%" },
          right: { value: "0", unit: "%" },
          left: { value: "auto", unit: null },
          bottom: { value: "auto", unit: null },
        };
        break;
      case "bottom-left":
        newCSSPositionValues = {
          bottom: { value: "0", unit: "%" },
          left: { value: "0", unit: "%" },
          right: { value: "auto", unit: null },
          top: { value: "auto", unit: null },
        };
        break;
      case "bottom-right":
        newCSSPositionValues = {
          bottom: { value: "0", unit: "%" },
          right: { value: "0", unit: "%" },
          left: { value: "auto", unit: null },
          top: { value: "auto", unit: null },
        };
        break;
      case "top":
        newCSSPositionValues = {
          top: { value: "0", unit: "%" },
          left: { value: "0", unit: "%" },
          right: { value: "0", unit: "%" },
          bottom: { value: "auto", unit: null },
        };
        break;
      case "right":
        newCSSPositionValues = {
          right: { value: "0", unit: "%" },
          top: { value: "0", unit: "%" },
          bottom: { value: "0", unit: "%" },
          left: { value: "auto", unit: null },
        };
        break;
      case "bottom":
        newCSSPositionValues = {
          bottom: { value: "0", unit: "%" },
          left: { value: "0", unit: "%" },
          right: { value: "0", unit: "%" },
          top: { value: "auto", unit: null },
        };
        break;
      case "left":
        newCSSPositionValues = {
          left: { value: "0", unit: "%" },
          top: { value: "0", unit: "%" },
          bottom: { value: "0", unit: "%" },
          right: { value: "auto", unit: null },
        };
        break;
    }

    updatePositionValues(newCSSPositionValues);
  };

  const sx: SxProps = useMemo(() => {
    const commonStyles = {
      top: { top: 0 },
      bottom: { bottom: 0 },
      left: { left: 0 },
      right: { right: 0 },
    };

    switch (position) {
      case "top-left":
        return { ...commonStyles.top, ...commonStyles.left };
      case "top-right":
        return { ...commonStyles.top, ...commonStyles.right };
      case "bottom-left":
        return { ...commonStyles.bottom, ...commonStyles.left };
      case "bottom-right":
        return { ...commonStyles.bottom, ...commonStyles.right };
      case "top":
        return {
          ...commonStyles.top,
          left: "50%",
          width: "100%",
          transform: "translateX(-50%)",
        };
      case "right":
        return {
          ...commonStyles.right,
          top: "50%",
          height: "100%",
          transform: "translateY(-50%)",
        };
      case "bottom":
        return {
          ...commonStyles.bottom,
          left: "50%",
          width: "100%",
          transform: "translateX(-50%)",
        };
      case "left":
        return {
          ...commonStyles.left,
          top: "50%",
          height: "100%",
          transform: "translateY(-50%)",
        };
      default:
        return {};
    }
  }, [position]);

  return (
    <Tooltip title={position} placement="top">
      <Box
        onClick={handleClick}
        sx={{
          border: "1px solid",
          position: "relative",
          width: "8%",
          height: "10%",
          ":hover": {
            backgroundColor: (themes) => themes.palette.grey[300],
          },
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: "30%",
            height: "30%",
            backgroundColor: "black",
            ...sx,
          }}
        />
      </Box>
    </Tooltip>
  );
};

const auto = { value: "auto", unit: null } as const;
const zero = { value: "0", unit: "px" } as const;

const STICKY_PRESETS: Array<{
  label: string;
  Icon: React.ElementType;
  values: types.CSSPositionValues;
}> = [
  {
    label: "Stick to top",
    Icon: NorthIcon,
    values: { top: zero, right: auto, bottom: auto, left: auto },
  },
  {
    label: "Stick to right",
    Icon: EastIcon,
    values: { top: auto, right: zero, bottom: auto, left: auto },
  },
  {
    label: "Stick to bottom",
    Icon: SouthIcon,
    values: { top: auto, right: auto, bottom: zero, left: auto },
  },
  {
    label: "Stick to left",
    Icon: WestIcon,
    values: { top: auto, right: auto, bottom: auto, left: zero },
  },
];

const StickyPresets = () => {
  const { updatePositionValues } = useContext(Context);

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
        px: 1,
        pt: 1,
        pb: 0,
      }}
    >
      {STICKY_PRESETS.map(({ label, Icon, values }) => (
        <Tooltip key={label} title={label} placement="top">
          <IconButton
            size="small"
            onClick={() => updatePositionValues(values)}
            sx={{
              p: "4px",
              borderRadius: "6px",
              backgroundColor: (theme) => theme.palette.grey[300],
              border: (theme) => `1px solid ${theme.palette.grey[400]}`,
              "&:hover": {
                backgroundColor: (theme) => theme.palette.grey[400],
              },
            }}
          >
            <Icon sx={{ fontSize: 13, color: "grey.700" }} />
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
};

export const Inset = (props: {
  position: "static" | "relative" | "absolute" | "fixed" | "sticky";
}) => {
  const { position: cssPosition } = props;

  const { updateFormData } = useStyleForm();
  const { formDataRef } = useStyleForm();

  const ref = useRef<HTMLDivElement>(null);

  const positionValuesRef = useRef<types.CSSPositionValues | undefined>(
    undefined
  );

  const [positionValues, setPositionValues] = useState<
    types.CSSPositionValues | undefined
  >(() => {
    const inset = formDataRef.current?.__position?.inset;
    if (!inset) return undefined;
    const parsed = cssPositionValueToJson(inset);
    positionValuesRef.current = parsed;
    return parsed;
  });

  const updatePositionValues = (
    newValues: types.CSSPositionValues | undefined
  ) => {
    positionValuesRef.current = newValues;
    setPositionValues(newValues);

    updateFormData({
      __position: {
        ...formDataRef.current.__position,
        position: cssPosition,
        inset: jsonToCssPositionValue(positionValuesRef.current),
      },
    });
  };

  const handleInputChange =
    (position: "top" | "bottom" | "left" | "right") =>
    (value: string | undefined) => {
      const { value: numValue, unit } = parseCssValue(value);

      const newCSSPositionValues: types.CSSPositionValues = {
        ...positionValuesRef.current,
        [position]: {
          value: numValue.toString(),
          unit: unit ?? "px",
        },
      } as types.CSSPositionValues;

      updatePositionValues(newCSSPositionValues);

      return {
        value: numValue.toString(),
        unit: unit ?? "px",
      };
    };

  const handleDeltaChange =
    (position: "top" | "bottom" | "left" | "right") =>
    (e: MouseEvent, delta: { x: number; y: number }) => {
      const deltaValue =
        position === "top" || position === "bottom" ? delta.y : delta.x;

      const newValue =
        parseFloat(
          !positionValuesRef.current
            ? "0"
            : (positionValuesRef.current[position]?.value ?? "0")
        ) + (deltaValue > 0 ? 1 : -1);
      const newUnit = !positionValuesRef.current
        ? "px"
        : (positionValuesRef.current[position]?.unit ?? "px");

      const newCSSPositionValues = {
        ...positionValuesRef.current,
        [position]: {
          value: newValue.toString(),
          unit: newUnit,
        },
      } as types.CSSPositionValues;

      updatePositionValues(newCSSPositionValues);

      return {
        value: newValue.toString(),
        unit: newUnit,
      };
    };

  const handleUnset = () => {
    positionValuesRef.current = undefined;
    setPositionValues(undefined);
    updateFormData({
      __position: {
        ...formDataRef.current.__position,
        inset: undefined,
      },
    });
  };

  return (
    <Context
      value={{
        updatePositionValues,
      }}
    >
      {cssPosition === "sticky" && <StickyPresets />}
      <Box
        ref={ref}
        sx={{
          width: "100%",
          height: cssPosition === "sticky" ? 80 : 120,
          position: "relative",
        }}
      >
        {cssPosition !== "sticky" && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 1,
              padding: 1,
              height: 150,
            }}
          >
            {(
              [
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "top",
                "right",
                "bottom",
                "left",
              ] as const
            ).map((pos) => (
              <PositionBox key={pos} position={pos} />
            ))}
          </Box>
        )}

        {(["top", "bottom"] as const).map((pos) => (
          <StyleMouseInput
            keyofUsage={"inset"}
            key={pos}
            ref={ref}
            sx={{
              [pos]: pos === "bottom" ? (cssPosition === "sticky" ? 5 : 20) : (cssPosition === "sticky" ? 5 : 33),
              left: "32%",
              width: "36%",
              height: cssPosition === "sticky" ? 20 : "20%",
            }}
            direction="vertical"
            value={positionToCssValue(pos, positionValues)}
            onDeltaChange={handleDeltaChange(pos)}
            onInputChange={handleInputChange(pos)}
            min={(unit) => (unit === "em" || unit === "rem" ? -50 : -200)}
            max={(unit) => (unit === "em" || unit === "rem" ? 50 : 200)}
            step={(unit) => {
              return unit === "em" || unit === "rem" ? 0.1 : 1;
            }}
          />
        ))}

        {(["left", "right"] as const).map((pos) => (
          <StyleMouseInput
            keyofUsage={"inset"}
            key={pos}
            ref={ref}
            sx={{
              top: cssPosition === "sticky" ? 5 : 33,
              [pos]: "16%",
              width: "15%",
              height: cssPosition === "sticky" ? 70 : "56%",
            }}
            direction="horizontal"
            value={positionToCssValue(pos, positionValues)}
            onDeltaChange={handleDeltaChange(pos)}
            onInputChange={handleInputChange(pos)}
            min={0}
            max={(unit) => (unit === "em" || unit === "rem" ? 50 : 200)}
            step={(unit) => (unit === "em" || unit === "rem" ? 0.1 : 1)}
          />
        ))}
      </Box>
      <Box sx={{ px: 1, pt: 0.5 }}>
        <Input
          readOnly
          clearable
          onClear={handleUnset}
          value={positionValues ? jsonToCssPositionValue(positionValues) : ""}
          sx={{ width: "100%" }}
        />
      </Box>
    </Context>
  );
};
