import fs from "fs";

import { copyFiles } from "../../../scripts/helpers/copy-files.mjs";
import { deleteFiles } from "../../../scripts/helpers/delete-files.mjs";

export const syncFiles = (srcDir, destDir, fileTypes) => {
  deleteFiles(destDir);
  copyFiles(srcDir, destDir, fileTypes);
};

export const baseDir = process.cwd();
export const baseTemplateOut = `${baseDir}/templates`;
