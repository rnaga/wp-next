"use server";

import { google } from "googleapis";

export type SubscribeState = {
  ok: boolean;
  message: string;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getGoogleAuth() {
  // Pass fetchImplementation explicitly so gaxios uses the global fetch rather
  // than attempting `await import('node-fetch')`, which fails in the Next.js
  // server-action bundle.
  const auth = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
    transporterOptions: {
      fetchImplementation: fetch,
    },
  });

  auth.setCredentials({
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });

  return auth;
}

async function verifyRecaptcha(token: string) {
  const secret = process.env.GOOGLE_RECAPTCHA_SECRET;

  if (!secret) {
    throw new Error("Missing RECAPTCHA_SECRET_KEY");
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    return false;
  }

  const data = (await res.json()) as {
    success: boolean;
    // v3-only fields
    score?: number;
    action?: string;
    ["error-codes"]?: string[];
  };

  // v3 returns a score 0.0–1.0; reject likely-bot traffic below 0.5.
  return data.success && (data.score === undefined || data.score >= 0.5);
}

async function createGoogleContact(email: string, fullName?: string) {
  const people = google.people({
    version: "v1",
    auth: getGoogleAuth(),
  });

  const requestBody: {
    emailAddresses: Array<{ value: string }>;
    names?: Array<{ displayName: string }>;
  } = {
    emailAddresses: [{ value: email }],
  };

  if (fullName) {
    requestBody.names = [{ displayName: fullName }];
  }

  const result = await people.people.createContact({
    personFields: "names,emailAddresses",
    requestBody,
  });

  const personResourceName = result.data.resourceName;

  if (!personResourceName) {
    throw new Error("Google did not return a contact resource name.");
  }

  return personResourceName;
}

async function addContactToGroup(personResourceName: string) {
  const people = google.people({
    version: "v1",
    auth: getGoogleAuth(),
  });

  const groupResourceName =
    process.env.GOOGLE_CONTACT_GROUP_RESOURCE_NAME ||
    "contactGroups/myContacts";

  await people.contactGroups.members.modify({
    resourceName: groupResourceName,
    requestBody: {
      resourceNamesToAdd: [personResourceName],
    },
  });
}

export async function getRecaptchaSiteKey(): Promise<string> {
  return process.env.GOOGLE_RECAPTCHA_SITEKEY || "";
}

export async function subscribe(
  _prevState: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  try {
    const email = normalizeEmail(String(formData.get("email") || ""));
    const fullName = String(formData.get("fullName") || "").trim();
    const recaptchaToken = String(
      formData.get("g-recaptcha-response") || ""
    ).trim();

    if (!email) {
      return { ok: false, message: "Email is required." };
    }

    if (!recaptchaToken) {
      return { ok: false, message: "Captcha token is missing." };
    }

    const isCaptchaValid = await verifyRecaptcha(recaptchaToken);

    if (!isCaptchaValid) {
      return { ok: false, message: "Captcha verification failed." };
    }

    const personResourceName = await createGoogleContact(
      email,
      fullName || undefined
    );

    await addContactToGroup(personResourceName);

    return {
      ok: true,
      message: "Subscribed successfully.",
    };
  } catch (error) {
    console.error("subscribe error", error);

    return {
      ok: false,
      message: "Subscription failed.",
    };
  }
}
