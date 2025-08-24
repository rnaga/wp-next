import type * as types from "../../types";
import { getProviders } from "next-auth/react";
import { redirect } from "next/navigation";

import { checkResetKey } from "../actions/password";
import { activate, canSignup } from "../actions/user-self-registration";
import { googleRecaptcha, isEmailEnabled } from "../utils";
import { getWPSession, WP } from "../wp";

/**
 * Handles authentication based on the provided props.
 *
 * @param props - The authentication props.
 * @returns The component to render based on the authentication path.
 */
export const Auth = async (props: types.auth.AuthProps) => {
  const { path } = await props.params;
  const { Lost, Reset, Login, Signup, Activate } = props;

  const wp = await WP();

  const emailEnabled = isEmailEnabled();

  let canSignupResult = false;

  switch (path) {
    case "lost":
      // Currently GMAIL is the only email provider.
      return <Lost emailEnabled={emailEnabled} />;

    case "reset":
      const { key: resetKey, user_login: userLoginReset } =
        await props.searchParams;

      console.info("Loading password reset key - ", resetKey, userLoginReset);
      const resultReset = await checkResetKey(resetKey, userLoginReset);

      return (
        <Reset
          error={resultReset.error}
          resetKey={resultReset.resetKey}
          userLogin={resultReset.userLogin}
        />
      );

    case "activate":
      const { key: activationKey, user_login: userLoginActivate } =
        await props.searchParams;

      const result = await activate({
        key: activationKey,
        user_login: userLoginActivate,
      });
      const success = result.data?.[0];
      const errorOrResetKey = result.error || result.data?.[1];
      return (
        <Activate
          error={!success ? errorOrResetKey : undefined}
          resetKey={errorOrResetKey}
          userLogin={userLoginActivate}
        />
      );

    case "signup":
      const { blogId } = await props.searchParams;
      canSignupResult = (await canSignup()).data;
      return (
        <>
          <googleRecaptcha.RecaptchaScript />
          <Signup
            blogId={blogId}
            providers={await getProviders()}
            googleRecaptchaSitekey={googleRecaptcha.getSiteKey()}
            canSignup={canSignupResult && emailEnabled}
          />
        </>
      );

    // Anything else routes to the login page
    default:
      const { callbackUrl, error } = await props.searchParams;
      canSignupResult = (await canSignup()).data;

      if (callbackUrl) {
        const wp = await WP();
        const session = await getWPSession();
        if (session) {
          redirect(callbackUrl);
        }
      }

      return (
        <Login
          providers={await getProviders()}
          error={error}
          // Signup is only available only when it's enabled in the db and
          // the email provider (gmail) is configured.
          canSignup={canSignupResult && emailEnabled}
        />
      );
  }
};
