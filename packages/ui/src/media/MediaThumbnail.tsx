import Image from "next/image";

import DocumentScannerOutlinedIcon from "@mui/icons-material/DocumentScannerOutlined";
import MusicVideoIcon from "@mui/icons-material/MusicVideo";
import VideoFileOutlinedIcon from "@mui/icons-material/VideoFileOutlined";
import { Icon } from "@mui/material";

import { getMimeType } from "@rnaga/wp-next-core/client/utils/media";

export const MediaThumbnail = (props: { uri: string }) => {
  const { uri } = props;

  if (!uri) {
    return null;
  }
  const mediaType = getMimeType(uri).split("/")[0];
  const iconSx = { transform: "scale(2)" };

  return mediaType == "image" ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img data-first-child src={uri} loading="lazy" alt="" />
  ) : (
    <Icon data-first-child>
      {mediaType == "audio" ? (
        <MusicVideoIcon sx={iconSx} />
      ) : mediaType == "video" ? (
        <VideoFileOutlinedIcon sx={iconSx} />
      ) : (
        <DocumentScannerOutlinedIcon sx={iconSx} />
      )}
    </Icon>
  );
};
