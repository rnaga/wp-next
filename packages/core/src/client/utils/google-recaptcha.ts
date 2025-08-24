declare global {
  interface Window {
    grecaptcha: any;
  }
}

const getToken = (siteKey?: string) =>
  new Promise<string | undefined>((resolve) => {
    if (!siteKey) {
      return;
    }

    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(siteKey, { action: "submit" })
        .then((token: string) => {
          resolve(token);
        });
    });
  });

export const googleRecaptcha = {
  getToken,
};
