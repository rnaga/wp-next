import path from "path";
import fs from "fs";
import type { NextConfig } from "next";
import getNextConfig from "./get-next-config";

/** @returns {NextConfig} */
export default function getNextDevConfig(): NextConfig {
  const nextBaseConfig = getNextConfig();

  const getResolveAlias = () => {
    // let resolveAlias = baseConfig.resolve?.alias ?? {};
    let resolveAlias = {};

    const srcPath = path.resolve(__dirname, "./src/_wp");
    if (fs.existsSync(srcPath)) {
      resolveAlias = {
        "_wp/settings": path.resolve(srcPath, "./settings.ts"),
        "_wp/hooks/client": path.resolve(srcPath, "./hooks/client/index.tsx"),
        "_wp/hooks/server": path.resolve(srcPath, "./hooks/server/index.ts"),
      };
    }

    // Internal packages have different paths in development
    // so they need to be resolved by alias.
    resolveAlias = {
      "@rnaga/wp-next-core": path.resolve(__dirname, "../wp-next-core/dist"),
      "@rnaga/wp-next-ui": path.resolve(__dirname, "../wp-next-ui/dist"),
      "@rnaga/wp-next-rte": path.resolve(__dirname, "../wp-next-rte/dist"),
      "@rnaga/wp-next-admin": path.resolve(__dirname, "../wp-next-admin/dist"),
    };

    return resolveAlias;
  };

  const nextConfig: NextConfig = {
    ...nextBaseConfig,

    // webpack config
    webpack: (config, context) => {
      const baseConfig = nextBaseConfig.webpack!(config, context);
      const resolveAlias = {
        ...baseConfig.resolve?.alias,
        ...getResolveAlias(),
      };

      if (baseConfig.resolve) {
        baseConfig.resolve.alias = resolveAlias;
      }
      return baseConfig;
    },

    // Turbopack config
    turbopack: {
      resolveAlias: getResolveAlias(),
    },
  };
  return nextConfig;
}
