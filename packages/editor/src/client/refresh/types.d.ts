import type { RefreshKeys } from "./RefreshContext";

export type RefreshFn = (keyNames?: Array<RefreshKeys>) => void;
