import DocumentScannerOutlinedIcon from "@mui/icons-material/DocumentScannerOutlined";
import { Icon, SxProps } from "@mui/material";
import * as wpCoreTypes from "@rnaga/wp-next-core/types";

import { getMimeType } from "@rnaga/wp-next-core/client/utils/media";

export const MediaTag = <T extends wpCoreTypes.actions.Posts[number]>(props: {
  post: T;
  slotSxProps?: {
    icon: SxProps;
  };
}) => {
  const { post, slotSxProps } = props;

  if (!post) {
    return null;
  }

  const mimeType = getMimeType(post.guid);
  const mediaType = mimeType.split("/")[0];

  return mediaType == "image" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      data-first-child
      src={post.guid}
      loading="lazy"
      alt=""
      style={{
        width: "100%",
        height: "auto",
        objectFit: "contain",
      }}
    />
  ) : mediaType == "audio" ? (
    <audio controls data-first-child style={{ maxHeight: 50 }}>
      <source src={post.guid} />
      Your browser does not support the video tag.
    </audio>
  ) : mediaType == "video" ? (
    <video controls data-first-child>
      <source src={post.guid} />
      Your browser does not support the video tag.
    </video>
  ) : (
    <Icon data-first-child sx={slotSxProps?.icon}>
      <DocumentScannerOutlinedIcon sx={slotSxProps?.icon} />
    </Icon>
  );
};
