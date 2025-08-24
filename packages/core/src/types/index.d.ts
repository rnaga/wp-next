declare module "next-auth" {
  export interface Session {
    user: {
      // Originally set by NextAuth
      name: string;
      email: string;
      // Added by wp-next
      ID: number;
      user_login: string;
    };
  }
}

declare module "next-auth/jwt" {
  export interface JWT {
    wp_user: {
      ID: number;
      user_login: string;
    };
  }
}

export * as hooks from "./hooks";
export * as actions from "./server-actions";
export * as client from "./client";
export { User } from "./client";
export * from "./media";
export * as auth from "./auth";
