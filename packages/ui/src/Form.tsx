import {
  FormControl as MuiFormControl,
  FormLabel as MuiFormLabel,
} from "@mui/material";
import { Typography } from "./Typography";

export const FormControl = MuiFormControl;
export const FormLabel = (props: React.ComponentProps<typeof MuiFormLabel>) => {
  const { children, required, ...rest } = props;
  return (
    <MuiFormLabel focused={false} {...rest}>
      <Typography size="medium" bold component="span">
        {children}
        {required ? (
          <Typography component="span" color="error.main" fontSize={18}>
            *
          </Typography>
        ) : (
          ""
        )}
      </Typography>
    </MuiFormLabel>
  );
};
