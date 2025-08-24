import GithubProvider from "next-auth/providers/github";
import WordpressProvider from "next-auth/providers/wordpress";
import GoogleProvider from "next-auth/providers/google";

import { filter, hook } from "@rnaga/wp-node/decorators/hooks";

import type * as wpTypes from "@rnaga/wp-node/types";

/**
 * NextAuthProvidersHook
 *
 * This hook adds NextAuth providers to the list of providers.
 *
 */
@hook("next_admin_nextauth_providers")
export class NextAuthProvidersHook {
  @filter("next_core_nextauth_providers")
  hookFilterProviders(
    ...args: wpTypes.hooks.FilterParameters<"next_core_nextauth_providers">
  ) {
    const [providers] = args;

    // Google provider
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
      providers.push(
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          // authorization: {
          //   params: {
          //     prompt: "consent",
          //     access_type: "offline",
          //     response_type: "code",
          //   },
          // },
        })
      );
    }

    // GitHub provider
    if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_SECRET) {
      providers.push(
        GithubProvider({
          clientId: process.env.GITHUB_CLIENT_ID as string,
          clientSecret: process.env.GITHUB_SECRET as string,
        })
      );
    }

    // WordPress provider
    if (
      process.env.WORDPRESS_CLIENT_ID &&
      process.env.WORDPRESS_CLIENT_SECRET
    ) {
      providers.push(
        WordpressProvider({
          clientId: process.env.WORDPRESS_CLIENT_ID,
          clientSecret: process.env.WORDPRESS_CLIENT_SECRET,
          token: {
            url: "https://public-api.wordpress.com/oauth2/token",
            async request(context) {
              const { provider, params: parameters, checks, client } = context;
              const { callbackUrl } = provider;

              const tokenset = await client.grant({
                grant_type: "authorization_code",
                code: parameters.code,
                redirect_uri: callbackUrl,
                code_verifier: checks.code_verifier,
                client_id: process.env.WORDPRESS_CLIENT_ID,
                client_secret: process.env.WORDPRESS_CLIENT_SECRET,
              });
              return { tokens: tokenset };
            },
          },
        })
      );
    }

    // console.log("providers", providers);
    return providers;
  }
}
