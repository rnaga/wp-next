import { FormEvent, useContext, useEffect, useState } from "react";

import { FormDataContext } from "../FormDataProvider";

type FormRecord = Record<string, any>;

type ContextValue<T extends FormRecord> = ReturnType<typeof useFormData<T>>;

const useFormDataMap = (key: string) => {
  const formDataMap = useContext(FormDataContext);
  const formData = formDataMap.get(key);

  if (!formData) {
    console.log("formDataMap.keys()", formDataMap.keys());
    throw new Error(`Form Data not found - ${key}`);
  }

  return formData ?? {};
};

export const useFormDataContext = <T extends FormRecord>(key: string) => {
  const context = useFormDataMap(key) as ContextValue<T>;

  return {
    formData: context.formData,
    setFormData: context.setFormData,
    resetFormData: context.resetFormData,
    validation: context.validation,
    setFormReady: context.setFormReady,
    formReady: context.formReady,
  };
};

type Validator<T> = (
  data: T
) => boolean | [false, string] | [false, string, Record<string, any>];

export function useFormData<T extends FormRecord>(
  key: string,
  options?: {
    initialValue?: T | undefined;
    initialReady?: boolean;
  }
) {
  const { initialValue, initialReady = false } = options ?? {};
  const formDataMap = useContext(FormDataContext);

  const [validation, setValidation] = useState<{
    valid: boolean;
    error?: string;
    errors?: Record<string, any>;
  }>();

  const [formData, setFormDataState] = useState<
    T extends Partial<any> ? T : Partial<T>
  >({ ...(initialValue ?? ({} as any)), ___ready: initialReady } as any);

  const resetFormData = () => {
    setFormDataState({} as any);
  };

  const setFormData = <Key extends keyof T>(
    input: Record<Key, T[Key]> | T,
    options?: Partial<{
      ready: boolean;
    }>
  ) => {
    setFormDataState({
      ...formData,
      ...input,
      ___ready: formData.___ready === true ? true : options?.ready ?? false,
    });
  };

  const setFormReady = (ready: boolean) => {
    setFormDataState({ ...formData, ___ready: ready });
  };

  const umount = () => {
    //console.log("umount", key);
    //formDataMap.delete(key);
  };

  useEffect(() => {
    return umount();
  }, []);

  const submit =
    (
      callback: (data: typeof formData) => any | Promise<any>,
      validator?: Validator<typeof formData>
    ) =>
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const data: typeof formData = {
        ...formData,
        ...Object.fromEntries<typeof formData>(
          new FormData(e.currentTarget) as any
        ),
      };

      let isValid = true;
      if (validator) {
        const result = validator(data);
        const newState =
          result === true
            ? {
                valid: true,
                error: undefined,
                errors: undefined,
              }
            : {
                valid: false,
                error: Array.isArray(result) ? result[1] : undefined,
                errors: Array.isArray(result) ? result[2] : undefined,
              };
        setValidation(newState);
        isValid = result === true;
      }

      if (!isValid) {
        return;
      }

      setValidation({ valid: true, error: undefined, errors: undefined });
      callback(data);
    };

  const { ___ready, ...formDataState } = formData;

  const value = {
    formData: formDataState as typeof formData,
    setFormData,
    resetFormData,
    umount,
    submit,
    validation,
    value: () => value,
    formReady: ___ready as boolean,
    setFormReady,
  };

  formDataMap.set(key, value);

  return value;
}
