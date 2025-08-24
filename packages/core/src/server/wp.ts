/// <reference types="../types" />

import "_wp/settings";

import { hooks } from "_wp/hooks/server";
import { AuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { headers } from "next/headers";

import Application from "@rnaga/wp-node/application";
import { defineHooks } from "@rnaga/wp-node/common/define-hooks";
import { checkPassword } from "@rnaga/wp-node/common/password";
import { User } from "@rnaga/wp-node/core/user";
import * as wpVal from "@rnaga/wp-node/validators";

import { jwtSessionMaxAge } from "./utils/jwt-session-maxage";

const getWPContext = async (env?: string) => {
  Application.registerHooks(hooks);
  env = env ?? process.env.WP_ENV ?? "default";
  return await Application.getContext(env);
};

export async function WP(env?: string) {
  const wp = await getWPContext(env);

  await wp.hooks.filter.asyncApply("next_core_init", wp);

  return wp;
}

export async function getWPSession() {
  const session = (await getServerSession(authOptions)) as Session;
  return session;
}

export async function getURL() {
  const headersList = await headers();
  return headersList.get(process.env.HEADER_X_URL ?? "x-url") as string;
}

export async function getPathname() {
  const url = new URL(await getURL());
  return url.pathname;
}

export async function getPaths(basePath: string) {
  try {
    const pathname = await getPathname();
    const regexPath = pathname.match(new RegExp(`^${basePath}/(.*)`));
    return regexPath ? regexPath[1].split("/") : [];
  } catch (e) {
    return [];
  }
}

export const getExternalNextAuthProviders = () => {
  const wpHooks = defineHooks("next_core_nextauth_provider", hooks);
  const providers = wpHooks.filter.apply("next_core_nextauth_providers", []);

  return providers;
};

const getAuthProviders = () => {
  // default provider that authenticates users using MySQL database
  const defaultProvider = CredentialsProvider({
    // The name to display on the sign in form (e.g. 'Sign in with...')
    name: "Credentials",
    // The credentials is used to generate a suitable form on the sign in page.
    // You can specify whatever fields you are expecting to be submitted.
    // e.g. domain, username, password, 2FA token, etc.
    // You can pass any HTML attribute to the <input> tag through the object.
    credentials: {
      username: { label: "Username", type: "text", placeholder: "jsmith" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      const username = credentials?.username ?? "";
      const password = credentials?.password ?? "";

      if (0 >= username.length || 0 >= password.length) {
        // Return null if user data could not be retrieved
        return null;
      }

      const wpUser = await authenticate(username, password);

      if (!wpUser) {
        console.log(
          `Invalid User - username: ${username} password: ${password}`
        );
        return null;
      }

      console.log("authorize", {
        id: `${wpUser.ID}`,
      });
      return {
        id: `${wpUser.ID}`,
        name: wpUser.user_login,
        email: wpUser.user_email,
      };
    },
  });

  return [defaultProvider, ...getExternalNextAuthProviders()];
};

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET as string,

  ...(!jwtSessionMaxAge()
    ? {}
    : {
        session: {
          strategy: "jwt",
          maxAge: jwtSessionMaxAge(),
        },
      }),

  // Configure one or more authentication providers
  providers: getAuthProviders(),
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log(
        `signIn: ${JSON.stringify(user)}`,
        "account",
        account,
        "profile",
        profile
      );

      if (!user?.email) {
        return false;
      }

      const email = user.email;
      const userName = user.name;

      let verified = (await verifyUser(email)) ? true : false;

      // if user's email is not verified, and provider isn't credentials,
      // check and register user with registerWithoutActivation
      if (!verified && account?.provider !== "credentials") {
        const wp = await WP();

        try {
          const result =
            await wp.utils.crud.userSelfRegistration.registerWithoutActivation({
              email,
              name: userName,
            });

          verified = result.data.user_id > 0;
          console.log(
            "user newly registered through registerWithoutActivation",
            JSON.stringify(result, null, 2)
          );
        } catch (e) {
          console.error(
            "Error registering user through registerWithoutActivation",
            e
          );
          return false;
        }
      }

      return verified;
    },
    async redirect({ baseUrl }) {
      if (process.env.WPAUTH_BASE_PATH === undefined) {
        console.error(
          "WPAUTH_BASE_PATH is not defined. Make sure to define it in Environment Variables (e.g. .env.local)"
        );
      }
      return `${baseUrl}${process.env.WPAUTH_BASE_PATH}`;
    },

    // This is the return value of getWPSession or getServerSession
    async session(args: any) {
      const session: any = args.session;
      const token = args.token;

      // const { name: userLogin, email } = session?.user;
      const { wp_user } = token;
      if (!token.email || !wp_user || !wp_user.ID || !wp_user.user_login) {
        console.error("No user data in the token.");
        return undefined;
      }

      // Set the user ID, user login, and email in the session.
      return {
        ...(session ?? {}),
        user: {
          ...session.user,
          ID: wp_user.ID,
          user_login: wp_user.user_login,
          email: token.email,
        },
      };
    },
    async jwt({ token, user, account, profile }) {
      // https://next-auth.js.org/configuration/callbacks
      // Use an if branch to check for the existence of parameters (apart from token).
      // If they exist, this means that the callback is being invoked for the first time
      // (i.e. the user is being signed in)
      if (user && account) {
        // - Add userId, email, and userLogin to the token
        const userId = account.provider === "credentials" ? user.id : undefined;
        const email = user.email;

        const wp = await getWPContext();

        // Get user data from the database based on the user login or email.
        const wpUser = await wp.utils.query.users((query) => {
          if (userId) {
            query.where("ID", userId);
          } else {
            query.where("user_email", email);
          }
          query.builder.first();
        }, wpVal.database.wpUsers);

        // Return emtpy token if user not found.
        if (!wpUser) {
          console.error(
            "Unset JWT since Neither user ID nor email is found in the database."
          );
          return undefined;
        }

        token = {
          ...token,
          wp_user: {
            ID: wpUser.ID,
            user_login: wpUser.user_login,
          },
        };
      }

      return token;
    },
  },

  pages: {
    signIn: "/auth/login/",
  },
};

export const verifyUser = async (userOrUserLogin: string | User) => {
  let user: User;

  const wp = await getWPContext();

  if (typeof userOrUserLogin == "string") {
    user = await wp.utils.user.get(userOrUserLogin as string);
  } else {
    user = await wp.utils.user.get(userOrUserLogin.props?.ID as number);
  }

  const userParsed = wpVal.database.wpUsers
    .omit({
      user_pass: true,
    })
    .safeParse(user.props);

  if (!userParsed.success || !user.role.name) {
    return undefined;
  }

  const wpUser = {
    ...userParsed.data,
  };

  return wpUser;
};

export const authenticate = async (userLogin: string, password: string) => {
  const wp = await getWPContext();
  const user = await wp.utils.user.get(userLogin);

  if (
    !user.props ||
    !user.props.user_pass ||
    !checkPassword(password, user.props.user_pass)
  ) {
    return undefined;
  }

  return await verifyUser(user);
};
