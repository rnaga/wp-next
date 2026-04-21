import { Box } from "@mui/material";
import type * as types from "../../../../types";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useBackground } from "./use-background";
import {
  backgroundValueToCSSString,
  backgroundValueToStringArray,
  hasBackgroundValue,
} from "../../../../lexical/styles/background";

export const PreviewBox = (props: {
  value: types.CSSBackgroundImage;
  placeholder: string;
}) => {
  const { placeholder, value } = props;

  if (!hasBackgroundValue(value)) {
    return (
      <Box
        sx={{
          p: 2,
          height: 100,

          textAlign: "center",
          // Center the content vertically
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          my: 1,
          borderRadius: 1,
          backgroundColor: "grey.200",
        }}
      >
        <Typography>{placeholder}</Typography>
      </Box>
    );
  }
  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        minHeight: 100,
        height: 100,
        background: backgroundValueToCSSString(value),
        borderRadius: 1,
        border: "1px solid #ccc",
        my: 2,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          maxWidth: "90%",
          transform: "translate(-50%, -50%)",
        }}
      >
        <Typography
          sx={{
            color: "grey",
            borderRadius: 0.5,
            backgroundColor: (theme) => theme.palette.grey[100],
            opacity: 0.8,
            px: 0.5,
            textAlign: "center",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            width: "100%",
          }}
        >
          {backgroundValueToStringArray(value).join(", ")}
        </Typography>
      </Box>
    </Box>
  );
};
