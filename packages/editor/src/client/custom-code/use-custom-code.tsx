import { useMemo } from "react";

import { useNavigation } from "@rnaga/wp-next-core/client/hooks";

import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { useCustomCodeTemplateSettingContext } from "./TemplateSettingContext";

import type * as types from "../../types";
import { useCustomCodeContext } from "./CustomCodeContext";

export const useCustomCode = () => {
  const customCodeContext = useCustomCodeContext();
  const customCodeTemplateSettingContext =
    useCustomCodeTemplateSettingContext();

  const { actions, parse } = useEditorServerActions();

  const { fetchAndSetList, fetchAndSetCurrentCustomCode } = customCodeContext;

  const customCodeAction = async <
    T extends keyof typeof actions.customCode,
    P extends Parameters<(typeof actions.customCode)[T]>,
    R extends ReturnType<(typeof actions.customCode)[T]>,
  >(
    action: T,
    ...args: P
  ) => {
    const serverAction = actions.customCode[action] as (
      ...args: P
    ) => Promise<any>;
    const [data, info] = await serverAction(...args).then(parse);

    fetchAndSetList();

    return { data, info } as R;
  };

  const serverActions = {
    fetchAndSetList,
    fetchAndSetCurrentCustomCode,
    create: async (...args: Parameters<typeof actions.customCode.create>) =>
      customCodeAction("create", ...args),
    update: async (...args: Parameters<typeof actions.customCode.update>) =>
      customCodeAction("update", ...args),
    del: async (...args: Parameters<typeof actions.customCode.del>) =>
      customCodeAction("del", ...args),
    updateTerms: async (
      ...args: Parameters<typeof actions.customCode.updateTerms>
    ) => customCodeAction("updateTerms", ...args),
    appendTerms: async (
      ...args: Parameters<typeof actions.customCode.appendTerms>
    ) => customCodeAction("appendTerms", ...args),
  };

  return {
    ...customCodeContext,
    actions: serverActions,
    templateSetting: {
      ...customCodeTemplateSettingContext,
    },
  };
};
