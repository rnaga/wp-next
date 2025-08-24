import { build } from "./helpers/build.mjs";

// Build wp-next-core
build({
  srcDir: "src",
  outDir: "dist",
  exclude: ["_wp"],
});
