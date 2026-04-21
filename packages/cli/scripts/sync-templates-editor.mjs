import fs from "fs";

import { syncFiles, baseDir, baseTemplateOut } from "./utils.mjs";

// Sync editor app files
const editorAppSrc = `${baseDir}/../editor/src/app`;
const editorAppOut = `${baseTemplateOut}/editor/src/app`;

syncFiles(editorAppSrc, editorAppOut, [".html", ".css", ".js", ".ts", ".tsx"]);

// Sync _wp files
const wpSrc = `${baseDir}/../editor/src/_wp`;
const wpOut = `${baseTemplateOut}/editor/_wp`;

syncFiles(wpSrc, wpOut, [".ts", ".tsx", ".json"]);

// Remove wp.json from dst — it is managed separately and should not be overwritten
const wpJsonOut = `${wpOut}/config/wp.json`;
if (fs.existsSync(wpJsonOut)) {
  fs.rmSync(wpJsonOut);
}

// Copy next-config file
const editorNextConfigSrc = `${baseDir}/../editor/next-config/get-next-config.ts`;
const editorNextConfigOut = `${baseTemplateOut}/editor/get-next-config.ts`;

fs.copyFileSync(editorNextConfigSrc, editorNextConfigOut);

// Copy proxy file
// Copy middleware.ts
const proxySrc = `${baseDir}/../editor/src/proxy.ts`;
const proxyOut = `${baseTemplateOut}/editor/src/proxy.ts`;

fs.copyFileSync(proxySrc, proxyOut);

// Copy preset templates
const presetTemplatesSrc = `${baseDir}/../editor/preset-templates`;
const presetTemplatesOut = `${baseTemplateOut}/editor/preset-templates`;

syncFiles(presetTemplatesSrc, presetTemplatesOut, [".ts", ".tsx", ".json"]);

// Copy .claude/skills files
const claudeSkillsFolders = ["wp-next-editor-template"];
const claudeSkillsSrc = `${baseDir}/../../.claude/skills`;
const claudeSkillsOut = `${baseTemplateOut}/editor/skills`;

for (const folder of claudeSkillsFolders) {
  const outDir = `${claudeSkillsOut}/${folder}`;
  if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true });
  }
  fs.mkdirSync(outDir, { recursive: true });
  syncFiles(`${claudeSkillsSrc}/${folder}`, outDir, [
    ".md",
    ".ts",
    ".tsx",
    ".json",
  ]);
}
