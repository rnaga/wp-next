/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from "jest";
//import nextJest from "next/jest.js";

// const createJestConfig = nextJest({
//   // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
//   dir: "./test-next",
// });

const config: Config = {
  testEnvironment: "node",
  moduleNameMapper: {
    "^@rnaga/wp-next-admin/(.*)$": "<rootDir>/packages/admin/src/$1",
    "^@rnaga/wp-next-core/(.*)$": "<rootDir>/packages/core/src/$1",
    "^@rnaga/wp-next-ui/(.*)$": "<rootDir>/packages/ui/src/$1",
    "^@rnaga/wp-next-editor/(.*)$": "<rootDir>/packages/editor/src/$1",
    "^_wp/(.*)$": "<rootDir>/test/_wp/$1",
    "^@/test/(.*)$": "<rootDir>/test/$1",
    "^next/navigation": "<rootDir>/test/mocks/empty.ts",
    "^@lexical/react/LexicalHistoryPlugin$": "<rootDir>/test/mocks/@lexical/react/LexicalHistoryPlugin.ts",
  },
  // exclude dist folders to avoid collision error - jest-haste-map: Haste module naming collision
  modulePathIgnorePatterns: [
    "<rootDir>/packages/admin/dist",
    "<rootDir>/packages/cli/dist",
    "<rootDir>/packages/core/dist",
  ],

  setupFiles: ["<rootDir>/test/jest.setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/test/bootstrap.ts"],
  coverageProvider: "v8",
  testMatch: ["**/?(*.)+(spec|test).+(ts|tsx|js)"],
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "test/tsconfig.jest.json",
        useESM: false,
      },
    ],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(lexical|@lexical)/)",
  ],

  // testEnvironment: "jsdom",
};

export default config;
//export default createJestConfig(config);
