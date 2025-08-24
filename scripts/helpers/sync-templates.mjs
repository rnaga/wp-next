import fs from "fs";

import { copyFile, mkdir } from "@rnaga/wp-node/common/files.js";
import { editFilesInDirectory } from "./edit-files-in-directory.mjs";

export const syncTemplates = () => {
  const distDir = `${process.cwd()}/src/cli/init-next/templates`;
  const srcDir = `${process.cwd()}/src`;

  // Remove the dist directory
  fs.rmSync(`${distDir}/_wp`, { recursive: true, force: true });
  fs.rmSync(`${distDir}/src`, { recursive: true, force: true });

  // Copy hooks into _wp directory
  mkdir(`${distDir}/_wp/hooks`);

  copyFile(`${srcDir}/_wp/hooks/`, `${distDir}/_wp/hooks/`, {
    recursive: true,
  });

  // Copy the app directory
  mkdir(`${distDir}/src/app`);

  copyFile(`${srcDir}/app/`, `${distDir}/src/app/`, { recursive: true });
  copyFile(`${srcDir}/middleware.ts`, `${distDir}/src/middleware.ts`);
  copyFile(
    `${process.cwd()}/get-next-config.js`,
    `${distDir}/get-next-config.js`
  );
  copyFile(`${process.cwd()}/next.config.js`, `${distDir}/next.config.js`);
  copyFile(`${process.cwd()}/tinymce.build.js`, `${distDir}/tinymce.build.js`);

  editFilesInDirectory(
    `${distDir}/src/app/`,
    new RegExp(/(?:\.\.\/)+(server|types\/.*)?/, "g"),
    "@rnaga/wp-next-admin-private/"
  );

  editFilesInDirectory(
    `${distDir}/_wp/`,
    new RegExp(/(?:@\/)(\/.*)?/, "g"),
    "@rnaga/wp-next-admin-private/"
  );

  // Replace ../../src/types with @rnaga/wp-next-admin-private/types
  editFilesInDirectory(
    `${distDir}/_wp/hooks`,
    new RegExp(/(?:\.\.\/)+src\/(types)/, "g"),
    "@rnaga/wp-next-admin-private/"
  );
};
