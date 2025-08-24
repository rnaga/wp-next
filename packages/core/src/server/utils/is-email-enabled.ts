export const isEmailEnabled = (): boolean => {
  return (
    process.env.ENABLE_GMAIL === "true" &&
    process.env.GMAIL_USER.length > 0 &&
    process.env.GMAIL_PASSWORD.length > 0
  );
};
