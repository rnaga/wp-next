import { execSync } from "child_process";
import fs from "fs";

import { wpConfig, wpPrompts } from "@rnaga/wp-node-cli/configs/wp.config";
import { init as initWp } from "@rnaga/wp-node-cli/init/init";
import Application from "@rnaga/wp-node/application";
import * as configs from "@rnaga/wp-node/common/config";
import {
  copyFile,
  mkdir,
  readJsonFile,
  updateEnvFile,
} from "@rnaga/wp-node/common/files";

import { seedEditorPresetTemplates } from "./editor-preset-templates";

import type * as types from "../types";

export const runInit = async (options: types.InitOptions) => {
  const {
    templateBaseDir,
    prompts,
    filesToCopy,
    dependencies,
    withSeedOption,
  } = options;
  const { program } = wpConfig();

  program
    .option("-j, --projectPath <path>", "project path")
    .option("-A, --adminUrl <url>", "admin url (e.g. http://localhost:3000)");

  if (withSeedOption) {
    program.option("--noSeedTemplates", "skip seeding editor preset templates");
  }

  try {
    const wpNextInput = await program
      .parseAsync(process.argv.filter((v) => v !== "--"))
      .then(async () => {
        const opts = program.opts();
        const input = await wpPrompts<types.WPNextInput>(opts, [
          {
            type: "input",
            name: "adminUrl",
            message: prompts.adminUrlMessage,
            initial: opts.adminUrl ?? "http://localhost:3000",
            skip: opts.adminUrl !== undefined,
            validate: (input: string) => {
              if (input.startsWith("http")) {
                return true;
              } else {
                return "Please enter a valid URL";
              }
            },
          },
          {
            type: "input",
            name: "projectPath",
            message: prompts.projectPathMessage,
            initial: opts.projectPath ?? "my-app",
            skip: opts.projectPath !== undefined,
          },
        ]);

        // wpPrompts converts multi via `responses.multi === "Yes"`, which only
        // works for the interactive select prompt. When -m is passed as a CLI flag,
        // the prompt is skipped and responses.multi is undefined, making multi
        // always false regardless of the flag value. Override it here using the
        // raw commander option so -m true/-m false are handled correctly.
        if (input && opts.multi !== undefined) {
          (input as unknown as Record<string, unknown>).multi =
            opts.multi === "true" || opts.multi === true;
        }

        return input;
      });

    const distDir = `./${wpNextInput.projectPath ?? "out"}`;

    // Install Next.js
    console.log("Installing Next.js...");
    execSync(
      `npm i -g create-next-app && npm exec -- create-next-app ${distDir} --typescript --turbopack false --eslint --no-tailwind --src-dir src --no-import-alias --app --no-react-compiler --no-agents-md --package=create-next-app`,
      { stdio: "inherit" }
    );

    // Initialize WP
    console.log("Initializing WP...");
    mkdir(`${distDir}/src/app`);
    await initWp({ ...wpNextInput, environment: "local", distDir });

    console.log("initializing WP Next...");

    // Get npx auth secret
    execSync("npm i -g auth");
    const nextAuthSecretOutput = String(execSync("npx auth secret"));
    const nextAuthSecret = nextAuthSecretOutput.split("=").pop()?.trim() ?? "";

    // Update environment variables in .env.local file
    const env = {
      ...options.env,
      NEXTAUTH_SECRET: nextAuthSecret,
      NEXTAUTH_URL: wpNextInput.adminUrl,
      BASE_URL: wpNextInput.adminUrl,
    };

    updateEnvFile(env, { environment: "local", distDir });

    // Copy _wp directory
    mkdir(`${distDir}/_wp`);
    copyFile(`${templateBaseDir}/_wp/`, `${distDir}/_wp/`, {
      recursive: true,
    });

    // Remove the default app directory and copy from template
    fs.rmSync(`${distDir}/src/app`, { recursive: true });
    mkdir(`${distDir}/src/app`);
    copyFile(`${templateBaseDir}/src/app/`, `${distDir}/src/app/`, {
      recursive: true,
    });

    // Remove the original next.config
    for (const nextConfig of [
      "next.config.ts",
      "next.config.mjs",
      "next.config.cjs",
    ]) {
      if (fs.existsSync(`${distDir}/${nextConfig}`)) {
        fs.rmSync(`${distDir}/${nextConfig}`);
      }
    }

    // Copy the remaining files
    filesToCopy.forEach((file) => {
      copyFile(`${templateBaseDir}/${file}`, `${distDir}/${file}`);
    });

    // Override npm run dev and build script
    execSync(`cd ${distDir} && npm pkg set scripts.dev="next dev --webpack"`, {
      stdio: "inherit",
    });

    execSync(
      `cd ${distDir} && npm pkg set scripts.build="next build --webpack"`,
      {
        stdio: "inherit",
      }
    );

    // Remove eslint config file
    fs.rmSync(`${distDir}/eslint.config.mjs`, { force: true });

    // Copy .npmrc if it exists (needed for private registries)
    if (fs.existsSync(".npmrc")) {
      fs.copyFileSync(".npmrc", `${distDir}/.npmrc`);
    }

    // Install dependencies
    execSync(`cd ${distDir} && npm i -S ${dependencies.join(" ")}`, {
      stdio: "inherit",
    });

    console.log("Done!");

    return wpNextInput;
  } catch (e) {
    console.error(e);
  }
};

export const runEditorInit = async (options: types.InitOptions) => {
  const { templateBaseDir } = options;

  try {
    const wpNextInput = await runInit({ ...options, withSeedOption: true });

    const {
      dbhost,
      dbport,
      dbuser,
      dbpassword,
      dbname,
      multi,
      staticAssetPath,
      adminUrl,
      projectPath,
    } = wpNextInput ?? {};

    // Setup WP application config
    const config = configs.defineWPConfig({
      staticAssetsPath: staticAssetPath || "public",
      multisite: {
        enabled: multi,
        defaultBlogId: 1,
        defaultSiteId: 1,
      },
      database: {
        client: "mysql2",
        connection: {
          database: dbname,
          host: dbhost,
          port: parseInt(`${dbport}`, 10),
          user: dbuser,
          password: dbpassword,
          charset: "utf8mb4",
        },
      },
    });

    Application.config = config;

    const wp = await Application.getContext();

    // Test DB connection and queries
    const post = await wp.utils.query.posts((query) => {
      query.where("ID", 1);
      query.select(["ID"]);
    });

    if (!post || 0 >= post.length) {
      throw new Error("Failed to connect to the database or fetch post");
    }

    if (!wpNextInput?.noSeedTemplates) {
      const seedResult = await seedEditorPresetTemplates(wp, templateBaseDir, {
        verbose: false,
      });

      const resultSummary = {
        collections: {
          created: seedResult.collections.filter((c) => c.status === "created")
            .length,
          skipped: seedResult.collections.filter((c) => c.status === "skipped")
            .length,
        },
        templates: {
          created: seedResult.templates.filter((t) => t.status === "created")
            .length,
          skipped: seedResult.templates.filter((t) => t.status === "skipped")
            .length,
        },
      };

      console.log("Seeding editor preset templates completed:");
      console.log(
        `Collections - Created: ${resultSummary.collections.created}, Skipped: ${resultSummary.collections.skipped}`
      );
      console.log(
        `Templates - Created: ${resultSummary.templates.created}, Skipped: ${resultSummary.templates.skipped}`
      );
    }
  } catch (e) {
    console.error(e);
  }
};
