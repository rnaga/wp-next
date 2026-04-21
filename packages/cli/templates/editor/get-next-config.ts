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

  const nextConfig: NextConfig = {
    // cacheComponents: false — Next.js 16.2.0 bug workaround.
    //
    // Setting `cacheComponents: true` implicitly enables PPR (`experimental.ppr = true`),
    // which adds dynamic routes like `/admin/[...paths]` to the prerender manifest as
    // PARTIALLY_STATIC. At runtime, server action POST requests to these routes are
    // incorrectly served the PPR static fallback shell (HTML) instead of executing the
    // action, because the fallback-shell condition in Next.js's `app-page.js` template
    // is missing a `!isPossibleServerAction` guard. The client receives HTML where it
    // expects `text/x-component`, resulting in "An unexpected response was received from
    // the server." This does not affect `npm run dev` because dev mode always sets
    // `supportsDynamicResponse: true`, bypassing the PPR fallback path.
    //
    // TODO: Re-enable once Next.js fixes the missing `!isPossibleServerAction` guard
    // in the PPR fallback-shell serving condition (app-page.js ~line 665).
    cacheComponents: false,
    serverExternalPackages: ["@rnaga/wp-node", "node:events"],

    experimental: {
      serverActions: {
        // Bump the body size limit for media uploads.
        // https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions#bodysizelimit
        bodySizeLimit: "10mb",
      },
    },

    // Only include TypeScript configuration when enableTypeScript is true
    ...(enableTypeScript && {
      typescript: {
        tsconfigPath,
      },
    }),

    webpack: (config, { webpack }) => {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^oracledb|pg-query-stream$/,
        }),
        new webpack.DefinePlugin({
          "process.env.FLUENTFFMPEG_COV": false,
        }),
        new webpack.ProvidePlugin({
          React: "react",
        })
      );

      config.resolve.alias = {
        ...config.resolve.alias,
        "_wp/settings": path.resolve(__dirname, "./_wp/settings.ts"),
        "_wp/hooks/client": path.resolve(
          __dirname,
          "./_wp/hooks/client/index.tsx"
        ),
        "_wp/hooks/server": path.resolve(
          __dirname,
          "./_wp/hooks/server/index.ts"
        ),
        "_wp/lexical": path.resolve(__dirname, "./_wp/lexical.ts"),
        "_wp/config/wp.json": path.resolve(__dirname, "./_wp/config/wp.json"),
      };

      config.ignoreWarnings = [
        {
          module:
            /node_modules\/knex\/lib\/migrations\/util\/import-file\.js|node_modules\/fluent-ffmpeg\/lib\/options\/misc.js|node_modules\/typescript\/lib\/typescript\.js/,
        },
      ];
      // Important: return the modified config
      return config;
    },
  };

  return nextConfig;
}
