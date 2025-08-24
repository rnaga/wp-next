import { build } from "./helpers/build.mjs";

// Build wp-next-admin
build({
  srcDir: "src",
  outDir: "dist",
  exclude: ["app", "_wp"],
  tsConfigFile: "tsconfig.build.json",
});
