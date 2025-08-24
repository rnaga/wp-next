import { Context } from "@rnaga/wp-node/core/context";
import type { AuthOptions } from "next-auth";

declare module "@rnaga/wp-node/types/hooks/filters.d" {
  export interface Filters {
    next_core_init: (wp: Context) => Promise<Context>;
    next_core_nextauth_providers: (
      providers: AuthOptions["providers"]
    ) => AuthOptions["providers"];
    next_core_media_uploaded: (
      wp: Context,
      file: File
    ) => Promise<
      | undefined
      | {
          url: string;
          filePath: string;
          metadata: Record<string, any>;
        }
    >;
  }
}

export interface Filters {}
