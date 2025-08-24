import {
  action as wpAction,
  filter as wpFilter,
} from "@rnaga/wp-node/decorators/hooks";

import type { Filters } from "./types/hooks/filters";
import type { Actions } from "./types/hooks/actions";

export const filter = <T extends keyof Filters>(
  key: T,
  priority?: number | undefined
) => {
  return wpFilter<Filters, T>(key, priority);
};

export const action = <T extends keyof Actions>(key: T) => {
  return wpAction<Actions, T>(key);
};
