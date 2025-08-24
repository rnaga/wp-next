import { WP } from "../wp";

export const getSignupActivateUrl = async (
  wp: Awaited<ReturnType<typeof WP>>,
  userLogin: string,
  activationKey: string
) => {
  return `${await wp.utils.link.getHomeUrl()}auth/activate?key=${activationKey}&user_login=${userLogin}`;
};
