import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
} from "react";
import { FormConfig, $isFormNode } from "../FormNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { createTypeScriptScaffolding } from "../scaffolding";

export type FormEditorContextType = {
  // Code editor state
  typescriptCode: string;
  setTypescriptCode: (code: string) => void;
  editorRef: React.RefObject<any>;

  // Form configuration state
  formConfig: FormConfig;
  setFormConfig: (config: FormConfig) => void;
  originalConfig: FormConfig;
  setOriginalConfig: (config: FormConfig) => void;

  // UI state
  isUpdatingHandler: boolean;
  setIsUpdatingHandler: (isUpdating: boolean) => void;

  // Methods
  rebuildTypeScriptScaffolding: () => void;
};

const Context = createContext<FormEditorContextType | undefined>(undefined);

export const FormEditorContext = (props: { children: React.ReactNode }) => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const editorRef = useRef<any>(undefined);
  const [typescriptCode, setTypescriptCode] = useState<string>("");
  const [formConfig, setFormConfig] = useState<FormConfig>({
    action: "",
  });
  const [originalConfig, setOriginalConfig] = useState<FormConfig>({
    action: "",
  });
  const [isUpdatingHandler, setIsUpdatingHandler] = useState(false);

  // Function to rebuild TypeScript scaffolding from node data
  const rebuildTypeScriptScaffolding = () => {
    if (!selectedNode || !$isFormNode(selectedNode)) {
      return;
    }

    const latestNode = editor.read(() => selectedNode.getLatest());
    const submitHandler = editor.read(() => latestNode.getSubmitHandler());
    const config = editor.read(() => latestNode.getConfig());
    const messageClassName = editor.read(() =>
      latestNode.getMessageClassName()
    );

    // Wrap the user's code body with scaffolding for display
    const fullTsCode = createTypeScriptScaffolding(
      config,
      messageClassName,
      submitHandler?.typescriptFunction // User's code body
    );
    setTypescriptCode(fullTsCode);
  };

  // Load and rebuild the TypeScript code when opening or when selectedNode changes
  useEffect(() => {
    rebuildTypeScriptScaffolding();
  }, [selectedNode]);

  // Listen for NODE_PROPERTY_UPDATED events to rebuild scaffolding
  useEffect(() => {
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      (payload) => {
        // Compare by key instead of reference since getWritable() creates new instances
        if (
          selectedNode &&
          $isFormNode(selectedNode) &&
          payload.node.getKey() === selectedNode.getKey()
        ) {
          rebuildTypeScriptScaffolding();
        }
        return false;
      },
      1
    );
  }, [selectedNode]);

  return (
    <Context
      value={{
        typescriptCode,
        setTypescriptCode,
        editorRef,
        formConfig,
        setFormConfig,
        originalConfig,
        setOriginalConfig,
        isUpdatingHandler,
        setIsUpdatingHandler,
        rebuildTypeScriptScaffolding,
      }}
    >
      {props.children}
    </Context>
  );
};

export const useFormEditor = (): FormEditorContextType => {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useFormEditor must be used within a FormEditorContext");
  }
  return context;
};
