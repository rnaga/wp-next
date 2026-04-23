import fs from "fs";

import { syncFiles, baseDir, baseTemplateOut } from "./utils.mjs";

// Sync admin app files
const adminAppSrc = `${baseDir}/../admin/src/app`;
const adminAppOut = `${baseTemplateOut}/admin/src/app`;

syncFiles(adminAppSrc, adminAppOut, [".html", ".css", ".js", ".ts", ".tsx"]);

// Sync _wp files
const wpSrc = `${baseDir}/../admin/src/_wp`;
const wpOut = `${baseTemplateOut}/admin/_wp`;

syncFiles(wpSrc, wpOut, [".ts", ".tsx", ".json"]);

// Delete config folder from _wp (it's not needed in the template)
fs.rmSync(`${wpOut}/config`, { recursive: true, force: true });

// Copy next-config file
const adminNextConfigSrc = `${baseDir}/../admin/next-config/get-next-config.ts`;
const adminNextConfigOut = `${baseTemplateOut}/admin/get-next-config.ts`;

fs.copyFileSync(adminNextConfigSrc, adminNextConfigOut);

// Copy middleware.ts
const middlewareSrc = `${baseDir}/../admin/src/middleware.ts`;
const middlewareOut = `${baseTemplateOut}/admin/src/middleware.ts`;

fs.copyFileSync(middlewareSrc, middlewareOut);
