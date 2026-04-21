import path from "path";
import fs from "fs";
import type { NextConfig } from "next";
import getNextConfig from "./get-next-config";

/** @returns {NextConfig} */
export default function getNextDevConfig(): NextConfig {
  const nextBaseConfig = getNextConfig();

  const nextConfig: NextConfig = {
    ...nextBaseConfig,
    webpack: (config, context) => {
      const baseConfig = nextBaseConfig.webpack!(config, context);
      let resolveAlias = baseConfig.resolve?.alias ?? {};

      const srcPath = path.resolve(__dirname, "./../src/_wp");

      if (fs.existsSync(srcPath)) {
        resolveAlias = {
          ...resolveAlias,
          "_wp/settings": path.resolve(srcPath, "./settings.ts"),
          "_wp/hooks/client": path.resolve(srcPath, "./hooks/client/index.tsx"),
          "_wp/hooks/server": path.resolve(srcPath, "./hooks/server/index.ts"),
          "_wp/lexical": path.resolve(srcPath, "./lexical.ts"),
          "_wp/config/wp.json": path.resolve(srcPath, "./config/wp.json"),
        };
      }

      // Internal packages have different paths in development
      // so they need to be resolved by alias.
      resolveAlias = {
        ...resolveAlias,
        "@rnaga/wp-next-core": path.resolve(__dirname, "../../core/dist"),
        "@rnaga/wp-next-ui": path.resolve(__dirname, "../../ui/dist"),
        "@rnaga/wp-next-rte": path.resolve(__dirname, "../../rte/dist"),
        "@rnaga/wp-next-admin": path.resolve(__dirname, "../../admin/dist"),
        "@rnaga/wp-next-editor": path.resolve(__dirname, "./../src"),
      };

      if (baseConfig.resolve) {
        baseConfig.resolve.alias = resolveAlias;
      }
      return baseConfig;
    },
  };
  return nextConfig;
}
