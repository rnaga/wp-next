import * as actionsUserSelfRegistration from "../../server/actions/user-self-registration";
import { googleRecaptcha } from "../utils";

export const useUserSelfRegistration = () => {
  const register = async (args: {
    email: string;
    username: string;
    googleRecaptchaSitekey?: string;
  }) => {
    const { email, username, googleRecaptchaSitekey } = args;

    if (!email || !username) {
      return new Error("No email or username provided");
    }

    let googleRecaptchaToken: string | undefined;

    if (googleRecaptchaSitekey) {
      googleRecaptchaToken = await googleRecaptcha.getToken(
        googleRecaptchaSitekey
      );
    }

    return await actionsUserSelfRegistration.register(
      {
        email,
        user_login: username,
      },
      googleRecaptchaToken
    );
  };

  const activate = async (args: { key: string; user_login: string }) => {
    const { key, user_login } = args;

    if (!key || !user_login) {
      return new Error("No key or user login provided");
    }

    return await actionsUserSelfRegistration.activate({ key, user_login });
  };

  return { register, activate };
};
