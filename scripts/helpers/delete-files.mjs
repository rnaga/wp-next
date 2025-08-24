import fs from "fs";
import path from "path";

export const deleteFiles = (dir, fileType) => {
  try {
    const files = fs.readdirSync(dir, { withFileTypes: true });
    files.forEach((dirent) => {
      const filePath = path.join(dir, dirent.name);
      if (dirent.isDirectory()) {
        deleteFiles(filePath, fileType); // Recursively delete files in directories
      } else if (dirent.name.endsWith(fileType)) {
        fs.unlinkSync(filePath);
      }
    });
  } catch (err) {
    //console.error(`Error deleting files: ${err}`);
  }
};
