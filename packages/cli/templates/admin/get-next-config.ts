import path from "path";
import type { NextConfig } from "next";

interface GetNextConfigOptions {
  enableTypeScript?: boolean;
  tsconfigPath?: string;
}

/** @returns {NextConfig} */
export default function getNextConfig(
  options: GetNextConfigOptions = {}
): NextConfig {
  // Check if 'NEXT_BUILD_DEV' environment variable is set (e.g., NEXT_BUILD_DEV=true)
  const isDevMode = process.env.NEXT_BUILD_DEV === "true";

  const {
    enableTypeScript = isDevMode, // Enable TypeScript by default when 'dev' argument is passed
    tsconfigPath = "./tsconfig.dev.build.json",
  } = options;

  const getResolveAlias = () => {
    return {
      // your previous aliases:
      "_wp/settings": path.resolve(__dirname, "./_wp/settings.ts"),
      "_wp/hooks/client": path.resolve(
        __dirname,
        "./_wp/hooks/client/index.tsx"
      ),
      "_wp/hooks/server": path.resolve(
        __dirname,
        "./_wp/hooks/server/index.ts"
      ),
    };
  };

  const nextConfig: NextConfig = {
    serverExternalPackages: ["@rnaga/wp-node", "knex", "node:events"],

    // Only include TypeScript configuration when enableTypeScript is true
    ...(enableTypeScript && {
      typescript: {
        tsconfigPath,
      },
    }),

    env: {
      FLUENTFFMPEG_COV: "false",
    },

    // webpack config
    webpack: (config, { webpack }) => {
      config.resolve.alias = {
        ...config.resolve.alias,
        ...getResolveAlias(),
      };

      config.ignoreWarnings = [
        {
          module:
            /node_modules\/knex\/lib\/migrations\/util\/import-file\.js|node_modules\/fluent-ffmpeg\/lib\/options\/misc.js/,
        },
      ];
      // Important: return the modified config.
      return config;
    },

    // Turbopack config.
    // TODO: Needs further testing and adjustments. This doesn't currently work properly.
    turbopack: {
      resolveAlias: getResolveAlias(),
    },
  };

  return nextConfig;
}
