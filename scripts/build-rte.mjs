import { build } from "./helpers/build.mjs";

// Build wp-next-ui
build({
  srcDir: "src",
  outDir: "dist",
  exclude: [],
  tsConfigFile: "tsconfig.build.json",
});
