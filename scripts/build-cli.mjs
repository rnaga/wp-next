import { build } from "./helpers/build.mjs";
import { copyFiles } from "./helpers/copy-files.mjs";

// Build wp-next-core
build({
  srcDir: "src",
  outDir: "dist",
});

// Copy templates
copyFiles("templates", "dist/templates", [
  ".html",
  ".css",
  ".js",
  ".ts",
  ".tsx",
  ".json",
]);
