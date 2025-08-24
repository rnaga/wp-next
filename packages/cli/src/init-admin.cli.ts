#!/usr/bin/env node

import { execSync } from "child_process";
import fs from "fs";

import { wpConfig, wpPrompts } from "@rnaga/wp-node-cli/configs/wp.config";
import { init as initWp } from "@rnaga/wp-node-cli/init/init";
import { copyFile, mkdir, updateEnvFile } from "@rnaga/wp-node/common/files";

import { Cli } from "@rnaga/wp-node-cli/cli";

import { command, subcommand } from "@rnaga/wp-node-cli/decorators";

interface WPNextInput {
  projectPath: string;
  adminUrl: string;
}

@command("initAdmin", {
  description: "Initialize the WP Next admin",
  version: "0.1.0",
})
export class InitAdminCli extends Cli {
  @subcommand("default")
  async default() {
    const { program } = wpConfig();

    const templateBaseDir = __dirname + "/templates/admin";

    program
      .option("-j, --projectPath <path>", "project path")
      .option("-A, --adminUrl <url>", "admin url (e.g. http://localhost:3000)");

    try {
      const wpNextInput = await program
        .parseAsync(process.argv.filter((v) => v !== "--"))
        .then(() => {
          const options = program.opts();
          return wpPrompts<WPNextInput>(options, [
            {
              type: "input",
              name: "adminUrl",
              message: "Enter your Admin URL:",
              initial: options.adminUrl ?? "http://localhost:3000",
              skip: options.adminUrl !== undefined,
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
              message: "Enter project path (What is your project named?):",
              initial: options.projectPath ?? "my-app",
              skip: options.projectPath !== undefined,
            },
          ]);
        });

      const distDir = `./${wpNextInput.projectPath ?? "out"}`;

      // Install Next.js
      console.log("Installing Next.js...");
      execSync(
        `npm i -g create-next-app && npm exec -- create-next-app ${distDir} --typescript --turbopack false --eslint --no-tailwind --src-dir src --no-import-alias --app --package=create-next-app `,
        {
          stdio: "inherit",
        }
      );

      // Initialize WP
      console.log("Initializing WP...");

      mkdir(`${distDir}/src/app`);
      await initWp({ ...wpNextInput, environment: "local", distDir });

      console.log("initializing WP Next...");

      // Get npx auth secret
      execSync("npm i -g auth");
      const nextAuthSecret = String(execSync("npx auth secret --raw"));

      // Update environment variables in .env.local file
      const env = {
        WPAUTH_BASE_PATH: "/admin",
        NEXTAUTH_SECRET: nextAuthSecret,
        UPLOAD_PATH: "uploads",
        WPADMIN_ENV: "default",
        BASE_URL: wpNextInput.adminUrl,
      };

      // Save environment variables in .env.local file
      updateEnvFile(env, {
        environment: "local",
        distDir,
      });

      // Copy hooks into _wp directory
      mkdir(`${distDir}/_wp/hooks`);
      copyFile(`${templateBaseDir}/_wp/hooks/`, `${distDir}/_wp/hooks/`, {
        recursive: true,
      });

      // Remove the default app directory
      fs.rmSync(`${distDir}/src/app`, { recursive: true });

      // Copy the app directory from the template
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

      const filesToCopy = [
        "src/middleware.ts",
        "next.config.ts",
        "get-next-config.ts",
        "tsconfig.json",
      ];

      // Copy the remaining files
      filesToCopy.forEach((file) => {
        copyFile(`${templateBaseDir}/${file}`, `${distDir}/${file}`);
      });

      // Override npm run dev and build script
      execSync(`cd ${distDir} && npm pkg set scripts.dev="next dev"`, {
        stdio: "inherit",
      });

      execSync(`cd ${distDir} && npm pkg set scripts.build="next build"`, {
        stdio: "inherit",
      });

      // Remove eslint config file
      fs.rmSync(`${distDir}/eslint.config.mjs`, { force: true });

      // Install dependencies
      const dependencies = [
        "@emotion/react",
        "@emotion/styled",
        "fs-extra",
        "@rnaga/wp-next-admin",
        "@rnaga/wp-node",
      ];

      execSync(`cd ${distDir} && npm i -S ${dependencies.join(" ")}`, {
        stdio: "inherit",
      });

      console.log("Done!");
    } catch (e) {
      console.error(e);
    }
  }
}
