"use client";
import { JSX, ReactElement, useEffect, useState } from "react";
import { FormHandlerConfig } from "../FormHandlerNode";
import { FORM_SUBMIT_EVENT_PREFIX } from "../constant";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { Fragment } from "react";
import { logger } from "../../../logger";

export const FormHandler = (props: { config: FormHandlerConfig }) => {
  const { wpHooks } = useWP();
  const [formLoaders, setFormLoaders] = useState<ReactElement[]>([]);
  const [formId, setFormId] = useState<string | null>(null);
  const [messageClassName, setMessageClassName] = useState<string | null>(null);
  const [formHandlerType, setFormHandlerType] = useState<string | null>(null);

  const handler = (event: Event) => {
    const formData = new FormData((event as CustomEvent).detail.form);
    logger.debug("Form data:", Array.from(formData.entries()));

    // Handle form submission logic here
    wpHooks.action.do(
      "next_editor_form_submit",
      formData,
      formId!,
      formHandlerType!,
      messageClassName!
    );
  };

  useEffect(() => {
    const formId = props.config.formId;
    const messageClassName = props.config.messageClassName;
    const formHandlerType = props.config.formHandlerType;

    logger.debug("FormHandler useEffect:", {
      formId,
      messageClassName,
      formHandlerType,
    });

    if (!formId || !messageClassName || !formHandlerType) {
      return;
    }

    setFormId(formId);
    setMessageClassName(messageClassName);
    setFormHandlerType(formHandlerType);

    window.addEventListener(`${FORM_SUBMIT_EVENT_PREFIX}${formId}`, handler);
    return () => {
      window.removeEventListener(
        `${FORM_SUBMIT_EVENT_PREFIX}${formId}`,
        handler
      );
    };
  }, [formId, messageClassName, formHandlerType]);

  useEffect(() => {
    if (!formId || !messageClassName || !formHandlerType) {
      return;
    }

    const loadFormElements = async () => {
      const asyncReactElements = wpHooks.filter.apply(
        "next_editor_form_load",
        [],
        formId,
        formHandlerType,
        messageClassName
      );

      logger.debug("Loading form elements:", {
        formId,
        formHandlerType,
        messageClassName,
      });

      const elements: ReactElement[] = [];
      for (const element of asyncReactElements) {
        const elementInstance = await element;
        elements.push(elementInstance);
      }

      logger.debug("Loaded form elements:", { elements });

      if (elements.length > 0) {
        setFormLoaders(elements);
      }
    };

    loadFormElements();
  }, [formId, messageClassName, formHandlerType]);

  return formLoaders.length > 0
    ? formLoaders.map((element, index) => (
        <Fragment key={index}>{element}</Fragment>
      ))
    : null;
};
