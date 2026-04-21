import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigation } from "@rnaga/wp-next-core/client/hooks";

import { EditorModal } from "./EditorModal";
import { TemplateSettingModal } from "./TemplateSettingModal";
import { TemplateSettingContext } from "./TemplateSettingContext";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";

import type * as types from "../../types";
import { useTemplate } from "../template";
import { getAllCustomCodes } from "../../lexical/lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { CUSTOM_CODE_FETCHED_AND_UPDATED } from "./commands";

const Context = createContext<{
  current: {
    // id: number;
    customCode?: types.CustomCode;
    set: (customCode: types.CustomCode) => void;
    all?: Record<types.CustomCodeInjectLocation, types.CustomCodeList>; // All custom code across templates including widgets
    setAll: (
      customCodes: Record<types.CustomCodeInjectLocation, types.CustomCodeList>
    ) => void;
  };
  modal: {
    open: boolean;
    customCode?: types.CustomCode;
    mimeType?: types.CustomCodeMimeType;
  };
  openModal: (args: {
    customCode?: types.CustomCode;
    mimeType?: types.CustomCodeMimeType;
  }) => void;
  closeModal: () => void;
  customCodes?: types.CustomCodes;
  setCustomCodes: (customCodes: types.CustomCodes) => void;
  fetchAndSetList: (
    ...args: Parameters<
      ReturnType<typeof useEditorServerActions>["actions"]["customCode"]["list"]
    >
  ) => Promise<{ customCodes: types.CustomCodes; info: any }>;
  fetchAndSetCurrentCustomCode: () => Promise<
    Record<types.CustomCodeInjectLocation, types.CustomCodeList>
  >;
}>({} as any);

export const useCustomCodeContext = () => useContext(Context);

export const CustomCodeContext = (props: { children: ReactNode }) => {
  const { children } = props;
  const [editor] = useLexicalComposerContext();
  const [modal, setModal] = useState({
    open: false as boolean,
    customCode: undefined as types.CustomCode | undefined,
    mimeType: undefined as types.CustomCodeMimeType | undefined,
  });

  //const { queryObject } = useNavigation<{ id: number }>();
  const [currentCustomCode, setCurrentCustomCode] = useState<
    types.CustomCode | undefined
  >();
  const [customCodes, setCustomCodes] = useState<types.CustomCodes>();
  const [allCustomCode, setAllCustomCode] = useState<
    Record<types.CustomCodeInjectLocation, types.CustomCodeList> | undefined
  >();
  const { current: currentTemplate } = useTemplate();

  const { wpHooks } = useWP();

  const { actions, parse } = useEditorServerActions();

  // const customCodeId = useMemo(
  //   () => parseInt(`${queryObject.id}`),
  //   [queryObject.id]
  // );

  const fetchAndSetList = async (
    ...args: Parameters<typeof actions.customCode.list>
  ) => {
    const [customCodes, info] = await actions.customCode
      .list(...args)
      .then(parse);
    setCustomCodes([...customCodes]);

    return { customCodes, info };
  };

  const fetchAndSetCurrentCustomCode = async (): Promise<
    Record<types.CustomCodeInjectLocation, types.CustomCodeList>
  > => {
    const result = await getAllCustomCodes(editor);
    setAllCustomCode(result);

    wpHooks.action.doCommand(CUSTOM_CODE_FETCHED_AND_UPDATED, {
      customCodes: result,
    });

    return result;
  };

  useEffect(() => {
    fetchAndSetList();
  }, []);

  const openModal = (args: {
    customCode?: types.CustomCode;
    mimeType?: types.CustomCodeMimeType;
  }) => {
    setModal({
      open: true,
      customCode: args.customCode,
      mimeType: args.mimeType,
    });
  };

  const closeModal = () => {
    setModal({
      open: false,
      customCode: undefined,
      mimeType: undefined,
    });
  };

  return (
    <Context
      value={{
        current: {
          //id: customCodeId,
          customCode: currentCustomCode,
          set: setCurrentCustomCode,
          all: allCustomCode,
          setAll: setAllCustomCode,
        },
        modal,
        openModal,
        closeModal,
        customCodes,
        setCustomCodes,
        fetchAndSetList,
        fetchAndSetCurrentCustomCode,
      }}
    >
      <TemplateSettingContext>
        <EditorModal />
        <TemplateSettingModal />
        {children}
      </TemplateSettingContext>
    </Context>
  );
};
