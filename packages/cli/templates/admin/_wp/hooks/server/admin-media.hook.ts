import fs from "fs";

import { getMetadata } from "@rnaga/wp-next-core/server/utils";
import { filter, hook } from "@rnaga/wp-node/decorators/hooks";

import type * as wpTypes from "@rnaga/wp-node/types";

/**
 * AdminMediaHook
 *
 * This hook is triggered when a media file is uploaded.
 * It saves the file to the server and returns the file path.
 *
 */
@hook("next_core_media_uploaded")
export class AdminMediaHook {
  /**
   * Hook method that is triggered when media is uploaded in the admin panel.
   * @param args - The arguments passed to the hook.
   * @returns A promise that resolves to the filtered result.
   */
  @filter("next_core_media_uploaded")
  async hookFilterUploaded(
    ...args: wpTypes.hooks.FilterParameters<"next_core_media_uploaded">
  ): Promise<
    wpTypes.hooks.FiltersAwaitedReturnType<"next_core_media_uploaded">
  > {
    const [wp, file] = args;
    const assetPath = `${wp.config.config.staticAssetsPath}`;
    const filename = file.name;

    const uploadPath = process.env.UPLOAD_PATH || "uploads";

    const relativeFilePath = `${uploadPath}/${filename}`;
    const absoluteFilePath = `${assetPath}/${relativeFilePath}`;

    const url = `${process.env.BASE_URL}/${relativeFilePath}`;

    let metadata: Awaited<ReturnType<typeof getMetadata>>;

    try {
      if (!fs.existsSync(assetPath)) {
        fs.mkdirSync(assetPath);
      }

      const buffer = Buffer.from(await (file as Blob).arrayBuffer());

      fs.writeFileSync(absoluteFilePath, buffer);
      metadata = await getMetadata(absoluteFilePath);
    } catch (err) {
      console.error(err);
      return undefined;
    }

    return {
      url,
      filePath: relativeFilePath,
      metadata: {
        ...metadata,
        filesize: file.size,
        file: relativeFilePath,
      },
    };
  }
}
