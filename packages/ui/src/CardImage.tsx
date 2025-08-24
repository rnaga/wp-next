import { Box, Card, CardMedia } from "@mui/material";
import { useWPTheme } from "./ThemeRegistry";
import { Typography } from "./Typography";

import { getMimeType } from "@rnaga/wp-next-core/client/utils/media";
import DocumentScannerOutlinedIcon from "@mui/icons-material/DocumentScannerOutlined";

export const CardImage = (
  props: {
    src?: string;
    alt?: string;
    width?: number | string;
    height?: number | string;
    component?: string;
    placeholder?: string;
  } & Parameters<typeof Card>[0]
) => {
  const { src, alt, width, height, sx, placeholder, component, ...rest } =
    props;
  const { wpTheme } = useWPTheme();
  const mimeType = getMimeType(src || "").split("/")[0];

  const componentString =
    mimeType === "image" ? "img" : mimeType === "video" ? "video" : undefined;

  return (
    <Card
      component={component || "li"}
      variant="outlined"
      sx={{
        flexGrow: 1,
        flexShrink: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "pointer",
        ...sx,
      }}
      {...(rest as any)}
    >
      {!src ? (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: width || 120,
            height: height || 120,
          }}
        >
          <Typography>{placeholder || "No image selected"}</Typography>
          {/* <PermMediaIcon
            sx={{
              width: width || 120,
              height: height || 120,
            }}
          /> */}
        </Box>
      ) : componentString ? (
        <CardMedia
          component={componentString}
          sx={{
            maxWidth: "100%",
            maxHeight: height || 200,
            objectFit: "cover",
          }}
          image={src}
          alt={alt || "Selected media"}
        />
      ) : (
        <DocumentScannerOutlinedIcon
          sx={{
            width: width || 120,
            height: height || 200,
          }}
        />
      )}
    </Card>
  );
};
