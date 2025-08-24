import fs from "fs";
import path from "path";

export const copyFiles = (srcDir, destDir, fileTypes) => {
  const filesToCopy = fs.readdirSync(srcDir, { withFileTypes: true });
  filesToCopy.forEach((file) => {
    const srcPath = path.join(srcDir, file.name);
    const destPath = path.join(destDir, file.name);
    if (file.isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyFiles(srcPath, destPath, fileTypes);
    } else if (fileTypes.some((type) => file.name.endsWith(type))) {
      fs.copyFileSync(srcPath, destPath);
    }
  });
};
