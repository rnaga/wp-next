import { getProviders } from "next-auth/react";
import { loginErrors } from "../client/utils/login-errors";

export type AuthProviders = Awaited<ReturnType<typeof getProviders>>;
export type LoginErrors = keyof typeof loginErrors;

export interface AuthLostProps {
  emailEnabled: boolean;
}

export interface AuthResetProps {
  error?: string;
  resetKey: string;
  userLogin: string;
}

export interface AuthLoginProps {
  error?: LoginErrors;
  canSignup?: boolean;
  providers: AuthProviders;
}

export interface AuthSignupProps {
  blogId?: string;
  providers: AuthProviders;
  googleRecaptchaSitekey?: string;
  canSignup: boolean;
}

export interface AuthActivateProps {
  error?: string;
  resetKey: string;
  userLogin: string;
}

type AuthPath = "login" | "lost" | "reset" | "signup" | "activate";

type AuthSearchParams<AuthPath> = AuthPath extends "reset" | "activate"
  ? {
      key: string;
      user_login: string;
      callbackUrl: never;
      error: never;
      blogId: never;
    }
  : AuthPath extends "login"
  ? {
      key: never;
      user_login: never;
      callbackUrl?: string;
      error?: keyof typeof loginErrors;
      blogId: never;
    }
  : AuthPath extends "signup"
  ? {
      key: never;
      user_login: never;
      callbackUrl: never;
      error: never;
      blogId: string;
    }
  : {
      key: never;
      user_login: never;
      callbackUrl: never;
      error: never;
      blogId: never;
    };

export type AuthProps = (
  | {
      params: Promise<{ path: "reset" }>;
      searchParams: Promise<AuthSearchParams<"reset">>;
    }
  | {
      params: Promise<{ path: "activate" }>;
      searchParams: Promise<AuthSearchParams<"activate">>;
    }
  | {
      params: Promise<{ path: "lost" }>;
      searchParams: Promise<AuthSearchParams<"lost">>;
    }
  | {
      params: Promise<{ path: "login" }>;
      searchParams: Promise<AuthSearchParams<"login">>;
    }
  | {
      params: Promise<{ path: "signup" }>;
      searchParams: Promise<AuthSearchParams<"signup">>;
    }
) & {
  Login: (props: AuthLoginProps) => JSX.Element;
  Lost: (props: AuthLostProps) => JSX.Element;
  Reset: (props: AuthResetProps) => JSX.Element;
  Signup: (props: AuthSignupProps) => JSX.Element;
  Activate: (props: AuthActivateProps) => JSX.Element;
};
