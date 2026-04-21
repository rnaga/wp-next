import { SxProps } from "@mui/material";
import * as types from "../../../types";
import { BasicMenuButton } from "@rnaga/wp-next-ui/BasicMenuButton";

export const CSSVariablesMenu = (props: {
  cssVariablesList?: types.CSSVariablesList;
  onChange: (cssVariable: types.CSSVariables) => void;
  loading?: boolean;
  label?: string;
  sx?: SxProps;
  size?: "small" | "medium";
}) => {
  const { cssVariablesList, loading, onChange, label, sx, size } = props;

  if (!cssVariablesList || cssVariablesList.length === 0) {
    return null;
  }

  return (
    <BasicMenuButton
      size={size}
      items={cssVariablesList.map((item) => ({
        label: item.name,
        value: item.ID.toString(),
      }))}
      onChange={(item) => {
        const selected = cssVariablesList.find(
          (cssVariable) => cssVariable.ID.toString() === item
        );
        onChange(selected as types.CSSVariables);
      }}
      label={
        loading === true ? "Loading..." : label ? label : "Select CSS Variable"
      }
      sx={sx}
    />
  );
};
