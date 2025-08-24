import { WP } from "../wp";

export const getResetPasswordUrl = async (
  wp: Awaited<ReturnType<typeof WP>>,
  userLogin: string,
  resetKey: string
) => {
  return `${await wp.utils.link.getHomeUrl()}auth/reset?key=${resetKey}&user_login=${userLogin}`;
};
