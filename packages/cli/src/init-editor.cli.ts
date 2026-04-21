#!/usr/bin/env node

import { Cli } from "@rnaga/wp-node-cli/cli";
import { wpConfig, wpPrompts } from "@rnaga/wp-node-cli/configs/wp.config";
import { command, subcommand } from "@rnaga/wp-node-cli/decorators";

import { resolveTemplateDir } from "./utils/resolve-template-dir";
import { runEditorInit } from "./utils/run-init";

@command("initEditor", {
  description:
    "Initialize the WP Next editor (installs both admin and editor packages)",
  version: "0.1.0",
})
export class InitEditorCli extends Cli {
  @subcommand("default")
  async default() {
    await runEditorInit({
      templateBaseDir: resolveTemplateDir(__dirname, "templates/editor"),
      prompts: {
        adminUrlMessage: "Enter your Admin (Editor) URL:",
        projectPathMessage: "Enter project path (What is your project named?):",
      },
      env: {
        WPAUTH_BASE_PATH: "/admin",
        UPLOAD_PATH: "uploads",
        WPADMIN_ENV: "default",
      },
      filesToCopy: [
        "get-next-config.ts",
        "next.config.ts",
        "src/proxy.ts",
        "tsconfig.json",
      ],
      dependencies: [
        "@emotion/react",
        "@emotion/styled",
        "fs-extra",
        "@rnaga/wp-next-admin",
        "@rnaga/wp-next-editor",
        "@rnaga/wp-node",
      ],
    });
  }

  @subcommand("addSamples", {
    description: "Add sample templates and collections to an existing project",
  })
  async addSamples() {
    const { program } = wpConfig();
  }
}
