import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { copyFiles } from "./copy-files.mjs";

export const build = ({
  exclude = [],
  copyFileExtensions = [],
  srcDir = "src",
  outDir = "dist",
  tsConfigFile = "tsconfig.json",
}) => {
  try {
    const baseDir = path.resolve(process.cwd(), ".");

    outDir = path.resolve(baseDir, outDir);
    srcDir = path.resolve(baseDir, srcDir);
    tsConfigFile = path.resolve(baseDir, tsConfigFile);

    console.log("Source directory:", srcDir);
    console.log("Output directory:", outDir);

    console.log("Deleting old build directory...");
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }

    console.log(`Building project... tsc --project ${tsConfigFile}`);
    execSync(`tsc --project ${tsConfigFile}`);

    console.log("Copying .d.ts, .css and other files...");
    copyFiles(srcDir, outDir, [".d.ts", ".css", ...copyFileExtensions]);

    console.log("Copying package.json to outDir...");
    fs.copyFileSync(
      path.join(baseDir, "package.json"),
      path.join(outDir, "package.json")
    );

    if (exclude.length > 0) {
      console.log("Deleting excluded files and directories...");
      exclude.forEach((dir) => {
        if (fs.existsSync(path.join(outDir, dir))) {
          fs.rmSync(path.join(outDir, dir), { recursive: true, force: true });
        }
      });
    }

    console.log("Build process completed successfully.");
  } catch (error) {
    console.error("An error occurred during the build process.");
    console.error(String(error));
  }
};
