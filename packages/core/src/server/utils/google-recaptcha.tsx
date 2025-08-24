import Script from "next/script";

interface RecaptchaResponse {
  success: boolean;
  challenge_ts?: string; // timestamp of the challenge load (ISO format)
  hostname?: string; // the hostname of the site where the reCAPTCHA was solved
  score?: number; // the score for this request (0.0 - 1.0)
  action?: string; // the action name for this request (important to verify)
  "error-codes"?: string[]; // possible error codes
}

const getSiteKey = () => process.env.GOOGLE_RECAPTCHA_SITEKEY;

// React Component to load the Google reCAPTCHA script
const RecaptchaScript = () => {
  const googleRecaptchaSiteKey = getSiteKey();
  console.log("googleRecaptchaSiteKey", googleRecaptchaSiteKey);

  if (!googleRecaptchaSiteKey) {
    return null;
  }

  return (
    <Script
      src={`https://www.google.com/recaptcha/api.js?render=${googleRecaptchaSiteKey}`}
    />
  );
};

// https://developers.google.com/recaptcha/docs/verify#api_request
const verifyToken = async (token?: string) => {
  if (!token) {
    // Skip verification if token is not provided
    return true;
  }

  if (!process.env.GOOGLE_RECAPTCHA_SECRET) {
    console.error("GOOGLE_SECRET_KEY is not defined");
    return false;
  }

  const url = "https://www.google.com/recaptcha/api/siteverify";
  const params = new URLSearchParams();
  params.append("secret", process.env.GOOGLE_RECAPTCHA_SECRET);
  params.append("response", token);

  try {
    const response = await fetch(url, {
      method: "POST",
      body: params,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    if (!response.ok) {
      console.error("Failed to verify reCAPTCHA token:", response.statusText);
      return false;
    }

    const responseJson = (await response.json()) as RecaptchaResponse;
    console.info("google recaptcha response responseJson", responseJson);

    return !!(
      responseJson.success &&
      responseJson.score &&
      responseJson.score > 0.5
    );
  } catch (error) {
    console.error("Failed to verify reCAPTCHA token:", error);
    return false;
  }
};

export const googleRecaptcha = {
  getSiteKey,
  RecaptchaScript,
  verifyToken,
};
