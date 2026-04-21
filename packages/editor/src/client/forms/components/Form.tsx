import {
  Box,
  FormLabel,
  Stack,
  FormControl as MuiFormControl,
} from "@mui/material";
import { SxProps } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const FormFlexBox = (props: {
  children: React.ReactNode;
  sx?: SxProps;
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        ...props.sx,
      }}
    >
      {props.children}
    </Box>
  );
};

export const FormStyleControl = (props: {
  title?: string;
  children: React.ReactNode;
  width?: string;
}) => {
  return (
    <Stack
      spacing={0.1}
      sx={{
        width: props.width ?? "50%",
        mt: 0.75,
      }}
    >
      {props.title && (
        <Typography
          sx={{
            fontSize: "0.75rem",
          }}
        >
          {props.title}
        </Typography>
      )}
      {props.children}
    </Stack>
  );
};

export const FormControl = (props: {
  children: React.ReactNode;
  label: string;
  sx?: SxProps;
  size?: "small" | "medium";
}) => {
  const { children, label, sx, size } = props;
  return (
    <MuiFormControl margin="none" sx={{ display: "block", ...sx }}>
      <Typography size={size}>{label}</Typography>
      {children}
    </MuiFormControl>
  );
};

export const FormLabelText = (props: {
  label: string;
  sx?: SxProps;
  children?: React.ReactNode;
  size?: "small" | "medium";
}) => {
  const { label, sx, children } = props;
  return (
    <Typography
      //variant={props.size === "medium" ? "body2" : "subtitle2"}
      size={props.size ?? "small"}
      sx={sx}
    >
      {label}
      {children}
    </Typography>
  );
};
