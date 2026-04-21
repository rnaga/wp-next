import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { Checkbox } from "@rnaga/wp-next-ui/Checkbox";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";

import {
  EmptyStateMessage,
  FormFlexBox,
  FormStyleControl,
} from "../../../../client/forms/components";
import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import {
  $getCollectionNames,
  $syncParentCollections,
} from "../../collection/CollectionNode";
import { useDataFetching } from "../../data-fetching/client/use-data-fetching";
import { getObjectKeysInArray } from "../../data-fetching/data-fetching-validator-utils";
import {
  $isSearchBoxNode,
  SearchBoxConfig,
  SearchBoxNode,
} from "../SearchBoxNode";
import { HelpText } from "../../../../client/forms/components/HelpText";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const SelectDataField = (props: {
  value: string | null;
  onChange: (value: string | null) => void;
  targetCollection: string | null;
  allowEmpty?: boolean;
}) => {
  const { value, onChange, targetCollection, allowEmpty = false } = props;
  const [editor] = useLexicalComposerContext();
  const [dataFields, setDataFields] = useState<string[]>([]);
  const { findDataFetchingNodeByCollection } = useDataFetching();

  useEffect(() => {
    if (!targetCollection) {
      setDataFields([]);
      return;
    }

    const result = findDataFetchingNodeByCollection(targetCollection);
    if (!result) {
      setDataFields([]);
      return;
    }

    const [dataFetchingNode, targetEditor] = result;

    targetEditor.read(() => {
      const dataName = dataFetchingNode.getName();
      // Find Data Fetching Node by targetCollection name

      const objectKeys = getObjectKeysInArray(targetEditor, dataName);
      setDataFields(objectKeys);
    });
  }, [targetCollection]);

  const options = dataFields.map((key) => ({
    value: key,
    label: key,
  }));

  return (
    <Select
      key="data-field"
      onChange={(key) => onChange(key)}
      enum={allowEmpty ? [{ value: " ", label: "None" }, ...options] : options}
      value={allowEmpty ? (value ?? " ") : value}
    />
  );
};

export const SearchBoxRightPanelForm = () => {
  const [editor] = useLexicalComposerContext();

  const { selectedNode } = useSelectedNode();

  const [config, setConfig] = useState<SearchBoxConfig>({});

  const [collectionNames, setCollectionNames] = useState<string[]>([]);

  useEffect(() => {
    if (!$isSearchBoxNode(selectedNode)) return;

    // Use getLatest() to resolve the current node version from the active editor
    // state. The selectedNode reference is captured at selection time and becomes
    // stale after subsequent editor.update() calls (e.g. form changes). Without
    // this, remounting the component (e.g. switching layers) would re-read config
    // from the old node instance and revert the form to its pre-edit state.
    editor.read(() => {
      const latest = selectedNode.getLatest() as SearchBoxNode;
      setConfig(latest.getConfig());
      setCollectionNames($getCollectionNames());
    });
  }, [selectedNode]);

  const handleChangeCollectionData = (value: string | null) => {
    if (!value) return;
    const newConfig = {
      ...config,
      targetCollection: value,
    };
    setConfig(newConfig);

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as SearchBoxNode;
        const writable = node.getWritable();
        writable.setConfig(newConfig);

        $syncParentCollections(writable);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  const handleToggleDropdown = (enabled: boolean) => {
    const newConfig = {
      ...config,
      dropdown: {
        ...config.dropdown,
        enable: enabled,
      },
    };
    setConfig(newConfig);

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as SearchBoxNode;
        const writable = node.getWritable();
        writable.setConfig(newConfig);

        $syncParentCollections(writable);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  const handleChangeMainField = (value: string | null) => {
    const newConfig = {
      ...config,
      dropdown: {
        ...config.dropdown,
        enable: config.dropdown?.enable ?? false,
        mainField: value ?? undefined,
      },
    };
    setConfig(newConfig);

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as SearchBoxNode;
        const writable = node.getWritable();
        writable.setConfig(newConfig);

        $syncParentCollections(writable);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  const handleChangeSubtitleField = (value: string | null) => {
    const newConfig = {
      ...config,
      dropdown: {
        ...config.dropdown,
        enable: config.dropdown?.enable ?? false,
        subtitleField: value || undefined,
      },
    };
    setConfig(newConfig);

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as SearchBoxNode;
        const writable = node.getWritable();
        writable.setConfig(newConfig);

        $syncParentCollections(writable);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  const handleChangePlaceholder = (value: string) => {
    const newConfig = {
      ...config,
      placeholder: value,
    };
    setConfig(newConfig);

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as SearchBoxNode;
        const writable = node.getWritable();
        writable.setConfig(newConfig);

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  const handleChangeUrlType = (value: "none" | "query" | "segment") => {
    setConfig({
      ...config,
      urlType: value,
    });

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as SearchBoxNode;
        const writable = node.getWritable();
        writable.setConfig({
          ...writable.getConfig(),
          urlType: value,
        });

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );
  };

  if (!$isSearchBoxNode(selectedNode)) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Box>
        <RightPanelSectionTitle title="Target Collection" />
        {collectionNames.length === 0 && (
          <EmptyStateMessage message="No collections found. Add a Collection node with a target data referencing a Data Fetching node to enable search." />
        )}
        {collectionNames.length > 0 && (
          <Select
            key="object-fit"
            onChange={handleChangeCollectionData}
            enum={collectionNames.map((key) => ({
              value: key,
              label: key,
            }))}
            value={config.targetCollection ?? null}
          />
        )}
      </Box>
      <Box>
        <RightPanelSectionTitle title="Placeholder" />
        <Input
          value={config.placeholder ?? ""}
          onChange={(value) => handleChangePlaceholder(value)}
          placeholder="Search..."
          sx={{
            width: "100%",
          }}
        />
      </Box>

      <Box>
        {config.targetCollection && (
          <>
            <RightPanelSectionTitle title="Dropdown Results" />

            <FormFlexBox
              sx={{
                alignItems: "center",
                mt: 0.75,
              }}
            >
              <Box
                sx={{
                  fontSize: "0.75rem",
                }}
              >
                Enable Results
              </Box>
              <Checkbox
                size="small"
                checked={config.dropdown?.enable ?? false}
                onChange={(e) => handleToggleDropdown(e.target.checked)}
              />
            </FormFlexBox>
            <HelpText>
              When enabled, search results will appear in a dropdown below the
              search box
            </HelpText>
          </>
        )}

        {config.targetCollection && config.dropdown?.enable && (
          <>
            <FormFlexBox>
              <FormStyleControl title="Main Field" width="90%">
                <SelectDataField
                  value={config.dropdown?.mainField ?? null}
                  onChange={handleChangeMainField}
                  targetCollection={config.targetCollection ?? null}
                />
              </FormStyleControl>
            </FormFlexBox>

            <FormFlexBox>
              <FormStyleControl title="Subtitle Field" width="90%">
                <SelectDataField
                  value={config.dropdown?.subtitleField ?? null}
                  onChange={handleChangeSubtitleField}
                  targetCollection={config.targetCollection ?? null}
                  allowEmpty
                />
              </FormStyleControl>
            </FormFlexBox>
          </>
        )}
      </Box>

      <Box>
        <RightPanelSectionTitle title="URL Type" />
        <Select
          onChange={(value) =>
            handleChangeUrlType(value as "none" | "query" | "segment")
          }
          enum={[
            {
              value: "none",
              label: "Disabled",
            },
            {
              value: "query",
              label: "Query Parameter",
            },
            {
              value: "segment",
              label: "URL Segment ",
            },
          ]}
          value={config.urlType ?? "none"}
        />
        <HelpText sx={{ mt: 0.5 }}>
          Select how the current search query is represented in the URL
        </HelpText>
      </Box>
    </Box>
  );
};
