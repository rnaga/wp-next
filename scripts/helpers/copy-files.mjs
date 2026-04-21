import fs from "fs";
import path from "path";

const _copyFiles = (srcDir, destDir, fileTypes) => {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  const filesToCopy = fs.readdirSync(srcDir, { withFileTypes: true });
  filesToCopy.forEach((file) => {
    const srcPath = path.join(srcDir, file.name);
    const destPath = path.join(destDir, file.name);
    if (file.isDirectory()) {
      _copyFiles(srcPath, destPath, fileTypes);
    } else if (fileTypes.some((type) => file.name.endsWith(type))) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
};

export const copyFiles = (srcDir, destDir, fileTypes) => {
  if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true });
  }
  _copyFiles(srcDir, destDir, fileTypes);
};

export const mergeFiles = (srcDir, destDir, fileTypes) => {
  _copyFiles(srcDir, destDir, fileTypes);
};
