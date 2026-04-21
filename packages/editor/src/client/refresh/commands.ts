import { createCommand } from "lexical";
import type { RefreshKeys } from "./RefreshContext";

export const REFRESH_COMMAND = createCommand<RefreshKeys[]>();
