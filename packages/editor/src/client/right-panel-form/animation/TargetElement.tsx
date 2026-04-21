import { Box } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Input } from "@rnaga/wp-next-ui/Input";
import { HelpText } from "../../forms/components/HelpText";

interface TargetElementProps {
  value: string;
  onChange: (value: string) => void;
}

export const TargetElement = ({ value, onChange }: TargetElementProps) => {
  return (
    <Box sx={{ width: "100%" }}>
      <Input
        size="small"
        value={value}
        onChange={(value) => onChange(value)}
        placeholder="Leave empty to animate source element"
        sx={{ width: "100%" }}
      />
      <HelpText sx={{ mt: 0.5 }}>
        CSS class name of element to animate when source element triggers the
        event (defaults to source)
      </HelpText>
    </Box>
  );
};
