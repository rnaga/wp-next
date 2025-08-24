import type * as types from "../../types";

type InitialState = Pick<types.client.GlobalState, "error">;

export const coreInitialState: InitialState = {
  error: {
    message: undefined,
  },
};
