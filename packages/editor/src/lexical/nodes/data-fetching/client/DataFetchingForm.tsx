import { $getRoot, HISTORY_MERGE_TAG } from "lexical";
import {
  createContext,
  FC,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import CodeEditor from "@monaco-editor/react";
import { Box } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Select } from "@rnaga/wp-next-ui/Select";

import { FormControl } from "../../../../client/forms/components";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useEditorServerActions } from "../../../../client/hooks/use-editor-server-actions";
import { $refreshNode } from "../../../lexical";
import {
  $processAllWidgetsSync,
  processAllWidgetsSync,
} from "../../widget/WidgetNode";
import {
  DATA_FETCHING_NODE_CHANGED_COMMAND,
  DATA_FETCHING_NODE_CREATED_COMMAND,
  DATA_FETCHING_NODE_DESTROYED_COMMAND,
} from "../commands";
import {
  $getDataFetchingNodeByName,
  $getDataFetchingNodeByType,
  $getDataPrefixName,
  $storeFetchedData,
  DataFetchingNode,
  DataFetchingQuery,
  fetchDataFetchingNode,
} from "../DataFetchingNode";

type FormItem = {
  title: string;
  component: FC;
};

const __forms = new Map<string, FormItem>();

export const registerDataFetchingForm = (
  nodeType: string,
  formItem: FormItem
) => {
  __forms.set(nodeType, formItem);
};

type UpdateQueryFunction = <T extends string | Record<string, any>>(
  dataOrKey: T,
  value?: T extends string ? any : never
) => void;

const Context = createContext<{
  currentNode: DataFetchingNode | undefined;
  setCurrentNode: (node: DataFetchingNode | undefined) => void;
  query: Record<string, any>;
  updateQuery: UpdateQueryFunction;
  clearQuery: () => void;
  options: Record<string, any>;
  updateOptions: (options: Record<string, any>) => void;
  clearOptions: () => void;
  updateAllowedQueryPassthroughKeys: (
    dataFetchingNode: DataFetchingNode | undefined | null,
    keys: string[]
  ) => void;
}>({} as any);

export const useDataFetchingForm = <
  T extends DataFetchingNode = DataFetchingNode,
>() => {
  const { currentNode, query, ...rest } = useContext(Context);

  const updateQuery = <
    T2 extends
      | keyof Parameters<T["setQuery"]>[0]
      | "dataType"
      | Parameters<T["setQuery"]>[0],
  >(
    dataOrKey: T2,
    value?: T2 extends string ? any : never
  ) => {
    rest.updateQuery(dataOrKey as any, value);
  };

  return {
    ...rest,
    currentNode: currentNode as T | undefined,
    updateQuery,
    query: query as DataFetchingQuery<T>,
  };
};

const DataFetchingForm = () => {
  const { currentNode, options, updateOptions } = useDataFetchingForm();

  const [formItem, setFormItem] = useState<FormItem>();

  const dataTypes = useMemo(() => {
    return Array.from(
      __forms
        .entries()
        .map(([key, value]) => ({ label: value.title, value: key }))
    );
  }, []);

  useEffect(() => {
    const newName = currentNode?.getName() ?? "";
    if (options.name === newName) return;

    updateOptions({ name: currentNode?.getName() ?? "" });
  }, [currentNode]);

  useEffect(() => {
    const dataType = options?.dataType ?? currentNode?.getType();
    const newFormItem = __forms.get(dataType ?? "") ?? undefined;
    setFormItem(newFormItem);
  }, [options]);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: "1fr",
        // width: "100%",
        // maxWidth: "100%",
      }}
    >
      <FormControl label={!!currentNode ? "Name" : "Name (Optional)"}>
        <Input
          size="medium"
          value={options?.name ?? " "}
          readOnly={!!currentNode}
          onChange={(value) => updateOptions({ name: value })}
          sx={{ width: "100%" }}
        />
      </FormControl>
      <FormControl label="Data Type">
        <Select
          size="medium"
          value={!currentNode ? options?.dataType : options?.dataTypeLabel}
          onChange={(value, item) => {
            updateOptions({ dataType: value, dataTypeLabel: item.label });
          }}
          enum={dataTypes}
          readOnly={!!currentNode}
        />
      </FormControl>

      {formItem?.component && <formItem.component />}
    </Box>
  );
};

export const DataFetchingFormModal = (props: {
  open: boolean;
  onClose: () => void;
  selectedDataFetchingNode?: DataFetchingNode;
}) => {
  const { open, onClose } = props;
  let { selectedDataFetchingNode } = props;
  const [loading, setLoading] = useState(false);
  const { wpHooks } = useWP();

  const [currentNode, setCurrentNode] = useState<DataFetchingNode>();
  const [editor] = useLexicalComposerContext();

  const serverActions = useEditorServerActions();

  const [query, setQuery] = useState<Record<string, any>>({});
  const [allowedQueryKeys, setAllowedQueryKeys] = useState<string[]>([]);
  const allowedQueryKeysRef = useRef(allowedQueryKeys);
  allowedQueryKeysRef.current = allowedQueryKeys;

  const queryChanged = useMemo(() => {
    if (!currentNode) return true;

    const currentQuery = currentNode?.getQuery() ?? {};

    return JSON.stringify(currentQuery) !== JSON.stringify(query);
  }, [currentNode, query]);

  const queryAllowedKeysChanged = useMemo(() => {
    if (!currentNode) return true;

    const currentAllowedKeys =
      currentNode?.getAllowedQueryPassthroughKeys() ?? [];

    return (
      JSON.stringify(currentAllowedKeys) !== JSON.stringify(allowedQueryKeys)
    );
  }, [currentNode, allowedQueryKeys]);

  const codeValue = useMemo(() => {
    if (!currentNode) return "";
    const nodeData = editor.read(() => currentNode.getLatest().getData());
    return JSON.stringify(nodeData, null, 4);
  }, [currentNode, query]);

  const updateAllowedQueryPassthroughKeys = (
    dataFetchingNode: DataFetchingNode | undefined | null,
    keys: string[]
  ) => {
    if (dataFetchingNode) {
      editor.update(
        () => {
          const writable = dataFetchingNode.getWritable();
          writable.setAllowedQueryPassthroughKeys(keys);
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
    }

    allowedQueryKeysRef.current = keys;
    setAllowedQueryKeys(keys);
  };

  const updateQuery: UpdateQueryFunction = useCallback(
    (dataOrKey, value) => {
      // Check if passing value is the same as the current value
      if (typeof dataOrKey === "string" && query[dataOrKey] === value) {
        return;
      }

      const newQuery =
        typeof dataOrKey === "string"
          ? { ...query, [dataOrKey]: value }
          : {
              ...query,
              ...(dataOrKey as Record<string, any>),
            };

      setQuery(newQuery);
    },
    [currentNode, query]
  );

  const clearQuery = () => {
    setQuery({});
  };

  const [options, setOptions] = useState<Record<string, any>>({});
  const updateOptions = (newOptions: Record<string, any>) => {
    const shouldUpdate = Object.keys(newOptions).some(
      (key) => options[key] !== newOptions[key]
    );

    if (!shouldUpdate) return;

    setOptions({
      ...options,
      ...newOptions,
    });
  };

  const clearOptions = () => {
    setOptions({});
  };

  useEffect(() => {
    setCurrentNode(selectedDataFetchingNode);

    editor.read(() => {
      setQuery(selectedDataFetchingNode?.getQuery() ?? {});
      setOptions(selectedDataFetchingNode?.getOptions() ?? {});

      const allowedKeys =
        selectedDataFetchingNode?.getAllowedQueryPassthroughKeys() ?? [];

      setAllowedQueryKeys(allowedKeys);
      allowedQueryKeysRef.current = allowedKeys;
    });
  }, [selectedDataFetchingNode]);

  const handleSubmit = async () => {
    let targetNode = currentNode;
    editor.update(
      () => {
        let writable: DataFetchingNode;

        if (!currentNode) {
          let newNode = $getDataFetchingNodeByType(options.dataType);

          const firstChild = $getRoot().getFirstChild();
          firstChild?.insertBefore(newNode);

          writable = newNode.getWritable();

          // Use the name from the form data if it exists,
          // otherwise generate a new name based on the type
          const dataName =
            options.name && options.name.trim().length > 0
              ? options.name
              : $getDataPrefixName(writable);

          // name can't be changed
          writable.setName(dataName.trim());

          targetNode = writable;
        } else {
          writable = currentNode.getWritable();
        }

        writable.setOptions({
          ...options,
          name: writable.getName(),
        });

        // Do clean up query before setting
        const cleanedQuery: Record<string, any> = {};
        for (const [key, value] of Object.entries(structuredClone(query))) {
          if (
            value !== null &&
            value !== undefined &&
            !(Array.isArray(value) && value.length === 0) &&
            !(typeof value === "string" && value.trim() === "")
          ) {
            cleanedQuery[key] = value;
          }
        }

        writable.setQuery(cleanedQuery);
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    const newTargetNode = editor.read(() =>
      targetNode?.getLatest()
    ) as DataFetchingNode;

    // Update Allowed Query Passthrough Keys
    editor.update(
      () => {
        const writable = newTargetNode.getWritable();
        writable.setAllowedQueryPassthroughKeys(allowedQueryKeysRef.current);
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    // Load data
    const [data, pagination] = await fetchDataFetchingNode(
      newTargetNode,
      editor,
      serverActions,
      {
        useCacheIfExists: false,
      }
    );

    editor.update(
      () => {
        const newWritable = $getDataFetchingNodeByName(
          newTargetNode?.getName()
        )?.getWritable();

        //newWritable?.setData(data);

        //const pagination = writable.getPagination();

        // pagination
        //   ? $storeFetchedData(newWritable, data, pagination)
        //   : $storeFetchedData(newWritable, data);

        if (newWritable) {
          // Set the current node to the writable node
          setCurrentNode(newWritable);

          editor.dispatchCommand(DATA_FETCHING_NODE_CREATED_COMMAND, {
            node: newWritable,
          });
        }
      },
      { discrete: true, tag: HISTORY_MERGE_TAG }
    );

    editor.update(
      () => {
        $refreshNode($getRoot());
      },
      { discrete: true, tag: HISTORY_MERGE_TAG }
    );

    processAllWidgetsSync(editor);
    wpHooks.action.doCommand(DATA_FETCHING_NODE_CHANGED_COMMAND, {
      node: targetNode!,
    });

    setLoading(false);
  };

  const handleDelete = (node: DataFetchingNode) => {
    editor.update(
      () => {
        node.remove();
        handleClose();
        editor.dispatchCommand(DATA_FETCHING_NODE_DESTROYED_COMMAND, {
          node,
        });
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
  };

  const handleClose = () => {
    setCurrentNode(undefined);
    clearQuery();
    clearOptions();
    onClose();
  };

  return (
    <Modal open={open} onClose={() => handleClose()}>
      <ModalContent
        sx={{
          width: "80%",
          // maxWidth: "95%",
        }}
      >
        <Context
          value={{
            currentNode,
            setCurrentNode,
            query,
            updateQuery,
            clearQuery,
            options,
            updateOptions,
            clearOptions,
            updateAllowedQueryPassthroughKeys,
          }}
        >
          <Typography size="large" bold sx={{ my: 1 }}>
            {currentNode ? `Edit (${currentNode.getName()})` : "Create"}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "0.3fr 0.7fr",
              gap: 2,
            }}
          >
            <Box
              sx={{
                maxHeight: "80dvh",
                overflowY: "auto",
              }}
            >
              <DataFetchingForm />
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  my: 1,
                }}
              >
                <Button
                  type="submit"
                  loading={loading}
                  onClick={handleSubmit}
                  disabled={
                    !!currentNode && !queryChanged && !queryAllowedKeysChanged
                  }
                >
                  {currentNode ? "Apply" : "Create"}
                </Button>
                {currentNode && (
                  <Button
                    color="error"
                    onClick={() => {
                      handleDelete(currentNode);
                    }}
                  >
                    Delete
                  </Button>
                )}
              </Box>
            </Box>

            <Box>
              <CodeEditor
                // https://microsoft.github.io/monaco-editor/typedoc/interfaces/editor.IStandaloneEditorConstructionOptions.html
                options={{
                  padding: { bottom: 0 },
                  autoIndent: "advanced",
                  formatOnPaste: true,
                  formatOnType: true,
                  readOnly: true,
                }}
                height="70dvh"
                defaultLanguage="json"
                value={codeValue}
              />
            </Box>
          </Box>
        </Context>
      </ModalContent>
    </Modal>
  );
};
