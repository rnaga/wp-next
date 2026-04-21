import { Auth } from "@rnaga/wp-next-core/server/components/Auth";
import type * as types from "@rnaga/wp-next-admin/types";
import {
  Login,
  Lost,
  Reset,
  Signup,
  Activate,
} from "@rnaga/wp-next-core/client/components/auth";

// eslint-disable-next-line import/no-anonymous-default-export
export default async (props: types.server.AuthProps) =>
  Auth({
    ...props,
    Login,
    Lost,
    Reset,
    Signup,
    Activate,
  });
