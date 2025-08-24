#!/usr/bin/env node

import { Clis } from "@rnaga/wp-node-cli/clis";
import { InitAdminCli } from "./init-admin.cli";
Clis.unregisterAll();
Clis.register([InitAdminCli]);

(async () => {
  await Clis.executeCommand(process.argv);
})();
