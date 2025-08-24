import {
  getResetPasswordUrl,
  sendMail,
  getSignupActivateUrl,
  isEmailEnabled,
} from "@rnaga/wp-next-core/server/utils";
import { action, hook } from "@rnaga/wp-node/decorators/hooks";

import type * as wpTypes from "@rnaga/wp-node/types";

import { z } from "zod";

/**
 * Notifications
 *
 * @description Send notifications to users
 */
@hook("next_notifications")
export class NotificationsHook {
  @action("core_register_new_user")
  async hookRegisterNewUserAction(
    ...args: wpTypes.hooks.ActionParameters<"core_register_new_user">
  ) {
    const [activationKey, userLogin, email, wp] = args;

    const siteDomain = wp.current.site?.props.blog.domain;
    console.log("user registered: ", userLogin, email, activationKey);

    if (!userLogin || !email || !z.email().safeParse(email).success) {
      console.error("Invalid userLogin or user email");
      return;
    }

    const subject = `${siteDomain} Account Activation`;
    const message = `
    Welcome ${userLogin}!
    To activate your account, please click the link below:
      ${await getSignupActivateUrl(wp, userLogin, activationKey)}
    If you did not register, please ignore this email.
    `;

    console.log("Sending email", subject, message);
    return await sendMail(subject, email, message);
  }

  @action("core_reset_password")
  async hookResetPasswordAction(
    ...args: wpTypes.hooks.ActionParameters<"core_reset_password">
  ) {
    const [resetKey, user, siteName, registration, wp] = args;
    const userLogin = user.props?.user_login;
    const email = user.props?.user_email;

    if (registration) {
      // Skip when triggered by registration.
      // This is because the registration email is already sent.
      return;
    }

    if (!isEmailEnabled()) {
      console.error("Email notifications are not enabled");
      return;
    }

    if (!userLogin || !email || !z.email().safeParse(email).success) {
      console.error("Invalid userLogin or user email");
      return;
    }

    const subject = `${siteName} Password Reset`;
    const message = `
    Someone has requested a password reset for the following account:
    Site Name: ${siteName}
    Username: ${user.props?.user_login}

    If this was a mistake, ignore this email and nothing will happen.
    To reset your password, visit the following address:
      ${await getResetPasswordUrl(wp, user.props.user_login, resetKey)}
    `;

    console.log(`Password reset email sent to ${userLogin}`);
    return await sendMail(subject, email, message);
  }
}
