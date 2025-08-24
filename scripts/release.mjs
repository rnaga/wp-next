import { execSync } from "child_process";

// This script is used to publish the package to npm.
//
// 1. Bump the version number.
// 2. Copy the .npmrc file to the dist directory.
// 3. Copy the package.json file to the dist directory.
// 4. Publish the package to npm.
const commands = [
  "npm --no-git-tag-version version patch",
  "cp -f .npmrc ./dist/",
  "cp -f package.json ./dist/",
  "cd ./dist/ && npm publish",
];

for (const command of commands) {
  execSync(command, { stdio: "inherit" });
}
