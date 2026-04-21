#!/usr/bin/env node

import { Command } from "commander";
import dotenv from "dotenv";
import { prompt as enquirerPrompt } from "enquirer";
import fs from "fs";
import os from "os";
import path from "path";

import { Cli } from "@rnaga/wp-node-cli/cli";
import { command, subcommand } from "@rnaga/wp-node-cli/decorators";
import Application from "@rnaga/wp-node/application";

import { seedEditorPresetTemplates } from "./utils/editor-preset-templates";
import { resolveTemplateDir } from "./utils/resolve-template-dir";

@command("editor", {
  description:
    "Utilities for working with the WP Next editor (installs both admin and editor packages)",
  version: "0.1.0",
})
export class EditorCli extends Cli {
  @subcommand("templateSeeder", {
    description: "Seed the database with sample templates and collections",
  })
  async templateSeeder(program: Command) {
    this.#resolveConfigDir(program);

    await this.settings({ program });

    const wp = await Application.getContext();
    const templateBaseDir = resolveTemplateDir(__dirname, "templates/editor");

    const seedResult = await seedEditorPresetTemplates(wp, templateBaseDir);
    this.output("info", {
      collections: seedResult.collections.map(
        (c) => `${c.title} (${c.slug}) — ${c.status}`
      ),
      templates: seedResult.templates.map(
        (t) => `${t.title} (${t.slug}) — ${t.status}`
      ),
    });
  }

  // Resolves the configDir option based on where _wp lives in the project.
  // - If configDir was already set (e.g. via -c / --config argument), do nothing.
  // - If -j / --configJson was passed, do nothing — configDir is not used in that path.
  // - If _wp exists directly in cwd (e.g. <project>/_wp), do nothing — the
  //   default CONFIG_DIR in wp-node-cli already points there.
  // - If _wp exists under src/ (e.g. <project>/src/_wp), set configDir to
  //   src/_wp/config so that settings() can find wp.json and friends.
  #resolveConfigDir(program: Command) {
    // Load .env.local so DB vars are available before settings() reads them
    const envLocal = path.resolve(process.cwd(), ".env.local");
    if (fs.existsSync(envLocal)) {
      dotenv.config({ path: envLocal });
    }

    if (
      program.getOptionValue("configDir") ||
      program.getOptionValue("configJson")
    ) {
      return;
    }

    const cwd = process.cwd();
    const wpDir = "_wp";
    if (!fs.existsSync(path.join(cwd, wpDir))) {
      const srcWpPath = path.join(cwd, "src", wpDir);
      if (fs.existsSync(srcWpPath)) {
        program.setOptionValue("configDir", path.join("src", wpDir, "config"));
      }
    }
  }

  @subcommand("agentSkills", {
    description:
      "Manage Agent Skills — reusable folders of instructions and resources that give agents new capabilities and expertise",
  })
  async agentSkills(program: Command) {
    program
      .argument("<action>", "action to perform: add or remove")
      .option("-o, --overwrite", "overwrite existing skill folders (add only)")
      .option("-d, --destination <path>", "destination path for skills");
    await program.parseAsync(this.argv);
    this.setCommand(program);
    const action = program.args[0] as string | undefined;
    const opts = program.opts<{ overwrite?: boolean; destination?: string }>();

    if (!action || (action !== "add" && action !== "remove")) {
      const { selectedAction } = await enquirerPrompt<{
        selectedAction: string;
      }>([
        {
          type: "select",
          name: "selectedAction",
          message: "What would you like to do with Agent Skills?",
          choices: [
            { name: "add", message: "Add / update skills" },
            { name: "remove", message: "Remove skills" },
          ],
        } as any,
      ]);
      (program.args as string[])[0] = selectedAction;
    }

    const resolvedAction = (program.args[0] as string) ?? action;

    const cwd = process.cwd();
    const homeSkillsDir = path.join(os.homedir(), ".claude", "skills");
    const repoSkillsDir = path.join(cwd, ".claude", "skills");

    const choices = [
      {
        name: "home",
        message: `Home directory (${homeSkillsDir})`,
        value: homeSkillsDir,
      },
      {
        name: "repo",
        message: `Current repo (${repoSkillsDir})`,
        value: repoSkillsDir,
      },
    ];

    const { destination: rawDestination } = await enquirerPrompt<{
      destination: string;
    }>([
      {
        type: "select",
        name: "destination",
        message: `Where would you like to ${resolvedAction} Agent Skills?`,
        choices,
        skip: opts.destination !== undefined,
        initial: opts.destination,
        result(name: string) {
          return choices.find((c) => c.name === name)?.value ?? name;
        },
      } as any,
    ]);

    const destination = opts.destination
      ? path.resolve(opts.destination)
      : rawDestination;

    const skillsTemplateDir = resolveTemplateDir(
      __dirname,
      "templates/editor/skills"
    );

    // The canonical list of skill folder names provided by this package
    const skillEntries = fs.readdirSync(skillsTemplateDir);

    if (resolvedAction === "remove") {
      const presentSkills = skillEntries.filter((entry) =>
        fs.existsSync(path.join(destination, entry))
      );

      if (presentSkills.length === 0) {
        this.output("info", {
          message: `No Agent Skills found at ${destination}`,
        });
        return;
      }

      const { confirm } = await enquirerPrompt<{ confirm: boolean }>([
        {
          type: "confirm",
          name: "confirm",
          message: `Remove the following skill folders from ${destination}: ${presentSkills.join(", ")}?`,
          initial: false,
        },
      ]);

      if (!confirm) {
        this.output("info", { message: "Removal cancelled" });
        return;
      }

      for (const entry of presentSkills) {
        fs.rmSync(path.join(destination, entry), {
          recursive: true,
          force: true,
        });
      }

      this.output("info", {
        message: `Agent Skills removed from ${destination}`,
        removed: presentSkills,
      });
      return;
    }

    // action === "add"
    fs.mkdirSync(destination, { recursive: true });

    const existingSkills = skillEntries.filter((entry) =>
      fs.existsSync(path.join(destination, entry))
    );

    let overwrite = opts.overwrite ?? false;

    if (!overwrite && existingSkills.length > 0) {
      const { confirm } = await enquirerPrompt<{ confirm: boolean }>([
        {
          type: "confirm",
          name: "confirm",
          message: `The following skill folders already exist: ${existingSkills.join(", ")}. Overwrite?`,
          initial: false,
        },
      ]);
      overwrite = confirm;
    }

    const copyRecursive = (src: string, dest: string) => {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
          copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    const skipped: string[] = [];
    for (const entry of skillEntries) {
      if (existingSkills.includes(entry) && !overwrite) {
        skipped.push(entry);
        continue;
      }
      copyRecursive(
        path.join(skillsTemplateDir, entry),
        path.join(destination, entry)
      );
    }

    this.output("info", {
      message: `Agent Skills installed to ${destination}`,
      installed: skillEntries.filter((e) => !skipped.includes(e)),
      ...(skipped.length > 0 ? { skipped } : {}),
    });
  }
}
