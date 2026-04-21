"use client";

import { useMemo } from "react";

import { useNavigation } from "@rnaga/wp-next-core/client/hooks";

import { useTemplateContext } from "./TemplateContext";

import type * as types from "../../types";

export const useTemplate = () => {
  const templateContext = useTemplateContext();
  const { queryObject } = useNavigation<{ id: number }>();
  const templateId = useMemo(() => queryObject.id, [queryObject.id]);

  return {
    ...templateContext,
    templateId,
  };
};
