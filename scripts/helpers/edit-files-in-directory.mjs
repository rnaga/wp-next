import * as fs from "fs";
import * as path from "path";

export const editFilesInDirectory = (directory, regex, replacement) => {
  // Arrow function to replace the string in the content using a regex pattern
  const replaceStringInContent = (content, regex, replacement) => {
    return content.replace(regex, replacement + "$1");
  };

  // Recursive arrow function to process files in a directory and subdirectories
  const processDirectory = (directory, regex, replacement) => {
    const items = fs.readdirSync(directory, { withFileTypes: true });

    items.forEach((item) => {
      const fullPath = path.join(directory, item.name);
      if (item.isDirectory()) {
        processDirectory(fullPath, regex, replacement); // Recurse into subdirectories
      } else if (
        (item.isFile() && item.name.endsWith(".tsx")) ||
        item.name.endsWith(".ts")
      ) {
        // console.log(`Processing file: ${fullPath}`);
        const content = fs.readFileSync(fullPath, "utf-8");
        const updatedContent = replaceStringInContent(
          content,
          regex,
          replacement
        );
        fs.writeFileSync(fullPath, updatedContent, "utf-8");
        // console.log(`Updated file: ${fullPath}`);
      }
    });
  };

  processDirectory(directory, regex, replacement);
};
