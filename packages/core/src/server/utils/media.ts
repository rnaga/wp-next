import mime from "mime-types";

import ffmpeg from "fluent-ffmpeg";
import ExifReader from "exifreader";

import pathToFfmpeg from "ffmpeg-static";

if (pathToFfmpeg) {
  ffmpeg.setFfmpegPath(pathToFfmpeg);
}

const getMimeType = (file: string) => {
  return mime.lookup(file) || "application/octet-stream";
};

export async function getMetadata(filePath: string) {
  const mimeType = getMimeType(filePath);

  const mediaType = mimeType.split("/")[0];

  let metadata: Awaited<
    ReturnType<
      | typeof getImageMetadata
      | typeof getVideoMetadata
      | typeof getAudioMetadata
    >
  > = {};

  if ("image" === mediaType) {
    metadata = await getImageMetadata(filePath);
  } else if ("video" === mediaType) {
    metadata = await getVideoMetadata(filePath);
  } else if ("audio" === mediaType) {
    metadata = await getAudioMetadata(filePath);
  }

  return {
    mime_type: mimeType,
    ...metadata,
  };
}

const filter = <T extends Record<string, any>>(metadata: T): Partial<T> => {
  let filtered = {};
  for (const [k, v] of Object.entries(metadata)) {
    if (v) {
      filtered = {
        ...filtered,
        [k]: v,
      };
    }
  }

  return filtered as T;
};

const ffmpegMetadata = async (filePath: string) => {
  const promise = (filePath: string) =>
    new Promise<ffmpeg.FfprobeData>((resolve, reject) =>
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(metadata);
      })
    );

  return await promise(filePath);
};

export async function getVideoMetadata(filePath: string) {
  const audioMetadata = await getStreamMetadata("audio", filePath);
  const metadata = await getStreamMetadata("video", filePath);

  return {
    ...filter(metadata),
    audio: filter(audioMetadata),
  };
}

export async function getAudioMetadata(filePath: string) {
  return filter(await getStreamMetadata("audio", filePath));
}

export async function getStreamMetadata(
  type: "video" | "audio",
  filePath: string
) {
  const metadata = await ffmpegMetadata(filePath);
  const stream = metadata.streams?.filter(
    (stream) => stream.codec_type == type
  )[0];

  console.log(metadata);
  return {
    bitrate: metadata?.format?.bit_rate, //stream?.bit_rate,
    length: stream?.duration_ts,
    width: stream?.width,
    height: stream?.height,
    codec: stream?.codec_name,
    codec_long_name: stream?.codec_long_name,
    sample_rate: stream?.sample_rate,
    channels: stream?.channels,
    bits_per_sample: stream?.bits_per_sample,
    display_aspect_ratio: stream?.display_aspect_ratio,
  };
}

export async function getImageMetadata(filePath: string) {
  try {
    const tags = await ExifReader.load(filePath, {
      async: true,
    });

    const metadata = {
      width: tags?.["Image Width"]?.value,
      height: tags?.["Image Height"]?.value,
      title: tags?.["ImageDescription"]?.value,
      caption: String(tags?.["UserComment"]),
      credit: tags?.["Artist"]?.description ?? tags?.["XPAuthor"]?.description,
      aperture: tags?.["FNumber"]?.description,
      camera: tags?.["Model"]?.description,
      created_timestamp: tags?.["DateTimeDigitized"]?.description,
      focal_length: tags?.["FocalLength"]?.description,
      iso: tags?.["ISOSpeedRatings"]?.description,
      shutter_speed: tags?.["ExposureTime"]?.description,
      orientation: tags?.["Orientation"]?.description,
    };

    console.log("metadata", metadata);

    return filter(metadata) as Partial<Record<keyof typeof metadata, any>> & {
      width: number;
      height: number;
    };
  } catch (e) {
    return await getVideoMetadata(filePath);
  }
}
