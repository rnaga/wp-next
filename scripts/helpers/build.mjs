import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { mergeFiles } from "./copy-files.mjs";

export const build = ({
  exclude = [],
  copyFileExtensions = [],
  srcDir = "src",
  outDir = "dist",
  tsConfigFile = "tsconfig.json",
}) => {
  try {
    const baseDir = path.resolve(process.cwd(), ".");

    // Resolve the TypeScript CLI from the current package first, then fall back
    // to the monorepo root. This keeps builds consistent even when PATH does not
    // include the workspace-local `tsc` binary.
    const localTsc = path.join(baseDir, "node_modules", ".bin", "tsc");
    const rootTsc = path.resolve(
      baseDir,
      "..",
      "..",
      "node_modules",
      ".bin",
      "tsc"
    );
    const tscBin = fs.existsSync(localTsc)
      ? localTsc
      : fs.existsSync(rootTsc)
        ? rootTsc
        : "tsc";

    outDir = path.resolve(baseDir, outDir);
    srcDir = path.resolve(baseDir, srcDir);
    tsConfigFile = path.resolve(baseDir, tsConfigFile);

    console.log("Source directory:", srcDir);
    console.log("Output directory:", outDir);

    console.log("Deleting old build directory...");
    if (fs.existsSync(outDir)) {
      fs.rmSync(outDir, { recursive: true, force: true });
    }

    console.log(
      `Building project... ${tscBin} --project ${tsConfigFile} --noEmitOnError`
    );
    execFileSync(tscBin, ["--project", tsConfigFile, "--noEmitOnError"], {
      stdio: "inherit",
    });

    console.log("Copying .d.ts, .css and other files...");
    mergeFiles(srcDir, outDir, [".d.ts", ".css", ...copyFileExtensions]);

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
    throw error;
  }
};
