#!/usr/bin/env node

import { Cli } from "@rnaga/wp-node-cli/cli";
import { command, subcommand } from "@rnaga/wp-node-cli/decorators";

import { resolveTemplateDir } from "./utils/resolve-template-dir";
import { runInit } from "./utils/run-init";

@command("initAdmin", {
  description: "Initialize the WP Next admin",
  version: "0.1.0",
})
export class InitAdminCli extends Cli {
  @subcommand("default")
  async default() {
    await runInit({
      templateBaseDir: resolveTemplateDir(__dirname, "templates/admin"),
      prompts: {
        adminUrlMessage: "Enter your Admin URL:",
        projectPathMessage: "Enter project path (What is your project named?):",
      },
      env: {
        WPAUTH_BASE_PATH: "/admin",
        UPLOAD_PATH: "uploads",
        WPADMIN_ENV: "default",
      },
      filesToCopy: [
        "src/middleware.ts",
        "next.config.ts",
        "get-next-config.ts",
        "tsconfig.json",
      ],
      dependencies: [
        "@emotion/react",
        "@emotion/styled",
        "fs-extra",
        "@rnaga/wp-next-admin",
        "@rnaga/wp-node",
      ],
    });
  }
}
