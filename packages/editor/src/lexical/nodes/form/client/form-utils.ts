/**
 * Sets the form message element's text and visibility. The optional callback
 * receives the element after the default mutations so callers can apply
 * additional styling (e.g. custom color or animation).
 */
export const setMessage = (
  messageClassName: string,
  text: string,
  ok: boolean,
  callback?: (el: HTMLElement) => void
) => {
  const messageEl = document.querySelector<HTMLElement>(`.${messageClassName}`);

  if (!messageEl) {
    return;
  }

  messageEl.textContent = text;
  messageEl.style.display = "block";
  messageEl.style.color = ok ? "green" : "crimson";
  callback?.(messageEl);
};

// Stores the original submit button label per formId so it can be restored after a loading state.
const submitButtonPreviousValue = new Map<string, string>();

/**
 * Updates the submit button label inside the given form and saves the previous
 * label so `restoreSubmitButton` can revert it. The optional callback receives
 * the element so callers can mutate its disabled state or apply other styling
 * (e.g. disable while loading).
 */
export const setSubmitButton = (
  formId: string,
  value: string,
  callback?: (el: HTMLButtonElement | HTMLInputElement) => void
) => {
  const submitEl = getSubmitButton(formId);

  if (!submitEl) {
    return;
  }

  const previous =
    submitEl instanceof HTMLInputElement
      ? submitEl.value
      : (submitEl.textContent ?? "");

  submitButtonPreviousValue.set(formId, previous);

  if (submitEl instanceof HTMLInputElement) {
    submitEl.value = value;
  } else {
    submitEl.textContent = value;
  }

  callback?.(submitEl);
};

/**
 * Restores the submit button label to the value it had before the last
 * `setSubmitButton` call for the same formId. No-op if no previous value was
 * stored. The optional callback receives the element after the label is
 * restored (e.g. to re-enable a disabled button).
 */
export const restoreSubmitButton = (
  formId: string,
  callback?: (el: HTMLButtonElement | HTMLInputElement) => void
) => {
  const previous = submitButtonPreviousValue.get(formId);

  if (previous === undefined) {
    return;
  }

  const submitEl = getSubmitButton(formId);

  if (!submitEl) {
    return;
  }

  if (submitEl instanceof HTMLInputElement) {
    submitEl.value = previous;
  } else {
    submitEl.textContent = previous;
  }

  submitButtonPreviousValue.delete(formId);
  callback?.(submitEl);
};

/**
 * Returns the value for a given FormData key, falling back to querying the
 * form element by `formId` for an `<input type="${inputType}">` when the key
 * is absent or empty. This lets callers find a field by its input type when
 * the field name in FormData is unknown or variable.
 */
export const getFormValue = (args: {
  formData: FormData;
  formId: string;
  key: string;
  inputType: string;
}): string => {
  const { formData, formId, key, inputType } = args;
  const fromData = String(formData.get(key) || "").trim();

  if (fromData) {
    return fromData;
  }

  const form = document.querySelector<HTMLFormElement>(`#${formId}`);
  return (
    form
      ?.querySelector<HTMLInputElement>(`input[type="${inputType}"]`)
      ?.value?.trim() ?? ""
  );
};

/**
 * Returns the submit button element inside the given form, or null if the
 * form or button cannot be found.
 */
export const getSubmitButton = (
  formId: string
): HTMLButtonElement | HTMLInputElement | null => {
  const form = document.querySelector<HTMLFormElement>(`#${formId}`);

  if (!form) {
    return null;
  }

  return form.querySelector<HTMLButtonElement | HTMLInputElement>(
    'button[type="submit"], input[type="submit"]'
  );
};
