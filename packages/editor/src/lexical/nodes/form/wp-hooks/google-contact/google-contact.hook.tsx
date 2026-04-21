"use client";

import {
  filter as clientFilter,
  action as clientAction,
} from "@rnaga/wp-next-core/decorators";
import { hook } from "@rnaga/wp-node/decorators/hooks";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import Script from "next/script";
import * as actions from "./actions";
import {
  getFormValue,
  restoreSubmitButton,
  setMessage,
  setSubmitButton,
} from "../../client/form-utils";
import { logger } from "../../../../logger";

const FORM_HANDLER_NAME = "google_contact";

// Caches the reCAPTCHA v3 site key per form so hookSubmit can call grecaptcha.execute without a round-trip.
const siteKeyCache = new Map<string, string>();

// Minimal typing for the reCAPTCHA v3 API exposed on window.
interface ReCaptchaV3 {
  ready: (callback: () => void) => void;
  execute: (siteKey: string, options: { action: string }) => Promise<string>;
}

@hook("form-google-contact")
export class FormGoggleContactHook {
  @clientFilter("next_editor_form_handler_name")
  hookFilter(
    ...args: Parameters<
      wpCoreTypes.hooks.Filters["next_editor_form_handler_name"]
    >
  ) {
    const [name] = args;
    return [
      ...name,
      {
        name: FORM_HANDLER_NAME,
        description:
          "Adds a contact to a Google Contacts group. Requires reCAPTCHA v3 verification on submit.",
      },
    ];
  }

  @clientFilter("next_editor_form_load")
  hookLoad(
    ...args: Parameters<wpCoreTypes.hooks.Filters["next_editor_form_load"]>
  ) {
    const [ReactElements, formId, formHandlerType] = args;

    logger.debug("Form load:", { formId, formHandlerType });
    if (formHandlerType !== FORM_HANDLER_NAME) {
      return ReactElements;
    }

    /**
     * Fetches the site key, caches it for use in hookSubmit, then injects the
     * reCAPTCHA v3 script. The site key must be embedded in the script URL so
     * grecaptcha.execute() is available before the first submit.
     */
    const loadRecaptchaScript = async () => {
      const siteKey = await actions.getRecaptchaSiteKey();
      siteKeyCache.set(formId, siteKey);
      logger.debug("Google reCAPTCHA v3 site key loaded:", siteKey);
      return (
        <Script
          key={`recaptcha-script-${formId}`}
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      );
    };

    return [...ReactElements, loadRecaptchaScript()];
  }

  @clientAction("next_editor_form_submit")
  hookSubmit(
    ...args: Parameters<wpCoreTypes.hooks.Actions["next_editor_form_submit"]>
  ) {
    const [formData, formId, formHandlerType, messageClassName] = args;

    if (formHandlerType !== FORM_HANDLER_NAME) {
      return;
    }

    const siteKey = siteKeyCache.get(formId) || "";

    formData.set(
      "email",
      getFormValue({ formData, formId, key: "email", inputType: "email" })
    );

    setSubmitButton(formId, "Submitting...", (el) => {
      el.disabled = true;
    });

    /**
     * v3 requires calling grecaptcha.execute() to obtain a one-time token just
     * before submission; unlike v2, there is no widget and no reset() call.
     */
    new Promise<string>((resolve, reject) => {
      (window.grecaptcha as unknown as ReCaptchaV3).ready(() => {
        (window.grecaptcha as unknown as ReCaptchaV3)
          .execute(siteKey, { action: "subscribe" })
          .then(resolve)
          .catch(reject);
      });
    })
      .then((token) => {
        formData.append("g-recaptcha-response", token);
        return actions.subscribe({ ok: false, message: "" }, formData);
      })
      .then((result) => {
        setMessage(messageClassName, result.message, result.ok);
        restoreSubmitButton(formId, (el) => {
          el.style.visibility = "hidden";
        });
      })
      .catch((error) => {
        logger.error("google-contact subscribe error:", error);
        setMessage(messageClassName, "Subscription failed.", false);
        restoreSubmitButton(formId, (el) => {
          el.style.visibility = "hidden";
        });
      });
  }
}
