/// <reference types="./config/index.d.ts" />

import * as dotenv from "dotenv";

import Application from "@rnaga/wp-node/application";
import * as configs from "@rnaga/wp-node/common/config";
import { hooks } from "./hooks/server";

import jsonConfig from "./config/wp.json";

// Load environment variables from .env file
dotenv.config({ path: ".env.local" });

if (!jsonConfig) {
  throw new Error("Failed to read wp.json file.");
}

const config = configs.defineWPConfig({
  ...jsonConfig,
  database: {
    client: "mysql2",
    connection: {
      database: process.env.WP_DB_NAME,
      host: process.env.WP_DB_HOST,
      port: 33306,
      user: process.env.WP_DB_USER,
      password: process.env.WP_DB_PASSWORD,
      charset: "utf8mb4",
    },
  },
});

Application.config = config;

Application.registerHooks(hooks);
