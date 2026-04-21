import { Box } from "@mui/material";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { HelpText } from "../../forms/components/HelpText";

export const PseudoElementSelector = (props: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const { value, onChange } = props;

  return (
    <Box sx={{ width: "100%" }}>
      <Select
        size="small"
        value={value || ""}
        enum={[
          { value: "", label: "None" },
          { value: "::before", label: "::before" },
          { value: "::after", label: "::after" },
        ]}
        onChange={onChange}
      />
      <HelpText sx={{ mt: 0.5 }}>
        Apply animation to a pseudo-element (e.g., ::after for overlay effects)
      </HelpText>
    </Box>
  );
};
