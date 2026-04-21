import { boolean } from "@rnaga/wp-node/validators/helpers";
import { createContext, useContext, useState } from "react";

import type * as types from "../../types";

export const Context = createContext<{
  modalOpen: boolean;
  openModal: VoidFunction;
  closeModal: () => void;
  content: Record<types.CustomCodeInjectLocation, string> | undefined;
  setContent: (content: Record<types.CustomCodeInjectLocation, string>) => void;
}>({} as any);

export const useCustomCodeTemplateSettingContext = () => useContext(Context);

export const TemplateSettingContext = (props: {
  children: React.ReactNode;
}) => {
  const { children } = props;
  const [modalOpen, setModalOpen] = useState(false);
  const [content, setContent] = useState<
    Record<types.CustomCodeInjectLocation, string> | undefined
  >();

  const openModal = () => {
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  return (
    <Context
      value={{
        modalOpen,
        openModal,
        closeModal,
        content,
        setContent,
      }}
    >
      {children}
    </Context>
  );
};
