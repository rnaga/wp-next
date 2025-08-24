import {
  getImageMetadata,
  getAudioMetadata,
  getVideoMetadata,
} from "../server/utils/media";

type BaseMetadata = {
  filesize: number;
  file: string;
  mime_type: string;
};

export type ImageMetadata = Awaited<ReturnType<typeof getImageMetadata>> &
  BaseMetadata;

export type VideoMetadata = Awaited<ReturnType<typeof getVideoMetadata>> &
  BaseMetadata;

export type AudioMetadata = Awaited<ReturnType<typeof getAudioMetadata>> &
  BaseMetadata;

export type MediaMetadata = ImageMetadata & VideoMetadata & AudioMetadata;

export type MediaMetas = {
  _wp_attachment_metadata: MediaMetadata;
  _wp_attachment_image_alt: string;
};

export type MediaMetakeys = (keyof MediaMetas)[]; //"_wp_attachment_metadata" | "_wp_attachment_image_alt"
