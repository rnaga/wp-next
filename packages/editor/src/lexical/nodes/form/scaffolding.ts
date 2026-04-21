import * as ts from "typescript";
import type { FormConfig } from "./FormNode";
import { logger } from "../../logger";
import { FORM_SUBMIT_EVENT_PREFIX } from "./constant";

// Default user code body (the editable part)
const getDefaultUserCodeBody = () => {
  return `  event.preventDefault();

  const setMessage = (text: string) => {
    const el = form.querySelector<HTMLElement>(\`.\${messageClassName}\`);
    el.style.display = "block";
    if (el) el.textContent = text;
  };

  fetch(config.action || form.action, {
    method: "POST",
    body: new FormData(form),
    credentials: "same-origin",
  })
    .then((res) => {
      if (res.status === 200) {
        if (config.redirectUrl) {
          window.location.assign(config.redirectUrl);
        } else {
          setMessage("Submitted successfully.");
        }
      } else {
        setMessage(\`Submission failed (status: \${res.status}).\`);
      }
    })
    .catch(() => {
      setMessage("Submission failed (network error).");
    });`;
};

// Extract editable body from full scaffolding (between // start and // end)
export const extractEditableBody = (fullCode: string): string => {
  const lines = fullCode.split("\n");
  let startIndex = -1;
  let endIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("// start")) {
      startIndex = i;
    }
    if (lines[i].includes("// end")) {
      endIndex = i;
      break;
    }
  }

  if (startIndex === -1 || endIndex === -1) {
    return "";
  }

  // Extract lines between start and end (exclusive)
  return lines.slice(startIndex + 1, endIndex).join("\n");
};

// Create full TypeScript scaffolding by wrapping user code with config/function wrapper
export const createTypeScriptScaffolding = (
  config: FormConfig,
  messageClassName: string,
  userCodeBody?: string
) => {
  const codeBody = userCodeBody || getDefaultUserCodeBody();

  return `const config: { action: string; redirectUrl?: string; } = ${JSON.stringify(
    config,
    null,
    2
  )};

const messageClassName = ${JSON.stringify(messageClassName)};

function onSubmit(form: HTMLFormElement, event: SubmitEvent) { // start
${codeBody}
} // end
`;
};

/**
 * Generates minimal JS for non-default form handlers — fires only the wpEvent
 * so FormHandlerNode can handle submission via WP action hooks.
 */
export const createWpEventOnlyCode = (formId: string): string => {
  const eventName = `${FORM_SUBMIT_EVENT_PREFIX}${formId}`;
  return `(() => {
  const form = document.querySelector('#${formId}');
  if (form) {
    form.addEventListener('submit', (submitEvent) => {
      submitEvent.preventDefault();
      const wpEvent = new CustomEvent('${eventName}', { detail: { form } });
      window.dispatchEvent(wpEvent);
    });
  }
})();`;
};

// Transpile TypeScript to JavaScript
export const transpileTypeScriptToJavaScript = (
  tsCode: string,
  formId: string,
  formHandlerType: string = "default"
): { jsCode: string; error?: string } => {
  // Non-default handlers skip the TypeScript scaffolding and just dispatch the
  // wpEvent — the actual submission logic is handled by FormHandlerNode via WP hooks.
  if (formHandlerType !== "default") {
    return { jsCode: createWpEventOnlyCode(formId) };
  }

  try {
    // Transpile the full scaffolding code
    const result = ts.transpileModule(tsCode, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.React,
        removeComments: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    });

    if (result.diagnostics && result.diagnostics.length > 0) {
      const errors = result.diagnostics
        .map((d: any) => {
          if (d.messageText) {
            return typeof d.messageText === "string"
              ? d.messageText
              : d.messageText.messageText;
          }
          return "Unknown error";
        })
        .join(", ");
      return { jsCode: "", error: `TypeScript errors: ${errors}` };
    }

    // The transpiled code has the config, messageClassName, and onSubmit function
    // Just wrap it in an IIFE with form selector and call onSubmit
    //
    // Trigger custom event to notify the FormHandler
    const eventName = `${FORM_SUBMIT_EVENT_PREFIX}${formId}`;

    const wrappedCode = `(() => {
  const form = document.querySelector('#${formId}');
  if (form) {
${result.outputText}
    form.addEventListener('submit', (submitEvent) => {
      onSubmit(form, submitEvent);

      const wpEvent = new CustomEvent('${eventName}', { detail: { form }} );
      window.dispatchEvent(wpEvent);
    });
  }
})();`;

    logger.log("Transpiled JavaScript code:", wrappedCode);

    return { jsCode: wrappedCode };
  } catch (error) {
    console.error("Transpilation error:", error);
    return {
      jsCode: "",
      error: `Transpilation error: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
};
