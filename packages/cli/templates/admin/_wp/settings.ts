/// <reference types="./config/index.d.ts" />

import * as dotenv from "dotenv";

import Application from "@rnaga/wp-node/application";
import * as configs from "@rnaga/wp-node/common/config";

import jsonConfig from "./config/wp.json";
// import jsonConfigTaxonomy from "./config/taxonomy.json";
// import jsonConfigPostType from "./config/post-type.json";
// import jsonConfigPostStatus from "./config/post-status.json";

// Load environment variables from .env file
dotenv.config({ path: ".env.local" });

if (!jsonConfig) {
  throw new Error("Failed to read wp.json file.");
}

// const taxonomies = configs.defineTaxonomies(jsonConfigTaxonomy);
// const postTypeObject = configs.definePostType(jsonConfigPostType);
// const postStatusObject = configs.definePostStatus(jsonConfigPostStatus);

const config = configs.defineWPConfig({
  ...jsonConfig,
  database: {
    client: "mysql2",
    connection: {
      database: process.env.WP_DB_NAME,
      host: process.env.WP_DB_HOST,
      port: parseInt(process.env.WP_DB_PORT ?? "3306"),
      user: process.env.WP_DB_USER,
      password: process.env.WP_DB_PASSWORD,
      charset: "utf8mb4",
    },
  },
  // taxonomies,
  // postTypeObject,
  // postStatusObject,
});

Application.config = config;
