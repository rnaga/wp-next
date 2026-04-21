#!/usr/bin/env node

import { Clis } from "@rnaga/wp-node-cli/clis";
import { InitAdminCli } from "./init-admin.cli";
import { InitEditorCli } from "./init-editor.cli";
import { EditorCli } from "./editor.cli";
Clis.unregisterAll();
Clis.register([InitAdminCli]);
Clis.register([InitEditorCli]);
Clis.register([EditorCli]);

(async () => {
  await Clis.executeCommand(process.argv);
})();
