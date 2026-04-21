import { Box } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Select } from "@rnaga/wp-next-ui/Select";
import type { TriggerEvent } from "../../../lexical/nodes/animation/types";
import { HelpText } from "../../forms/components/HelpText";

interface TriggerSelectorProps {
  value: TriggerEvent;
  onChange: (value: TriggerEvent) => void;
}

const TRIGGERS: { value: TriggerEvent; label: string; description: string }[] =
  [
    {
      value: "click",
      label: "Click / Tap",
      description: "When element is clicked or tapped",
    },
    {
      value: "dblclick",
      label: "Double Click",
      description: "When element is double-clicked",
    },
    {
      value: "hover",
      label: "Hover",
      description: "When mouse hovers over element",
    },
    {
      value: "mouseenter",
      label: "Mouse Enter",
      description: "When mouse enters element",
    },
    {
      value: "mouseleave",
      label: "Mouse Leave",
      description: "When mouse leaves element",
    },
    {
      value: "focus",
      label: "Focus",
      description: "When element receives focus",
    },
    { value: "blur", label: "Blur", description: "When element loses focus" },
    {
      value: "scroll",
      label: "Scroll",
      description: "When hovering over element and scrolling",
    },
    {
      value: "load",
      label: "Page Load",
      description: "When page finishes loading",
    },
  ];

export const TriggerSelector = ({ value, onChange }: TriggerSelectorProps) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Select
        size="small"
        value={value}
        enum={TRIGGERS}
        onChange={(value) => onChange(value as TriggerEvent)}
      />
      <HelpText sx={{ mt: 0.5 }}>
        {TRIGGERS.find((t) => t.value === value)?.description}
      </HelpText>
    </Box>
  );
};
