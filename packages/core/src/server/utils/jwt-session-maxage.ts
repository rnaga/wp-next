export const jwtSessionMaxAge = (): number | undefined => {
  const maxAge = process.env.JWT_LOGIN_SESSION_MAX_AGE;
  if (!maxAge || isNaN(parseInt(maxAge, 10))) {
    return undefined;
  }

  return parseInt(maxAge, 10);
};
