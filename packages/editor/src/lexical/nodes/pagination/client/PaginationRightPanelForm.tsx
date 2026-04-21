import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { Select } from "@rnaga/wp-next-ui/Select";

import { EmptyStateMessage } from "../../../../client/forms/components";
import { HelpText } from "../../../../client/forms/components/HelpText";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import {
  $getCollectionNames,
  $syncParentCollections,
} from "../../collection/CollectionNode";
import {
  $isPaginationNode,
  PaginationClassNames,
  PaginationConfig,
  PaginationNode,
} from "../PaginationNode";

export const SelectCollection = (props: {
  value: string | null;
  onChange: (value: string | null) => void;
  collectionNames: string[];
}) => {
  const { value, onChange, collectionNames } = props;

  return (
    <Select
      key="object-fit"
      onChange={(key) => onChange(key)}
      enum={collectionNames.map((key) => ({
        value: key,
        label: key,
      }))}
      value={value}
    />
  );
};

export const PaginationRightPanelForm = () => {
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();

  const { selectedNode } = useSelectedNode();

  const [config, setConfig] = useState<PaginationConfig>({});
  const [collectionNames, setCollectionNames] = useState<string[]>([]);

  useEffect(() => {
    if (!$isPaginationNode(selectedNode)) return;

    // Use getLatest() to resolve the current node version from the active editor
    // state. The selectedNode reference is captured at selection time and becomes
    // stale after subsequent editor.update() calls (e.g. form changes). Without
    // this, remounting the component (e.g. switching layers) would re-read config
    // from the old node instance and revert the form to its pre-edit state.
    editor.read(() => {
      const latest = selectedNode.getLatest() as PaginationNode;
      setConfig(latest.getConfig());
      setCollectionNames($getCollectionNames());
    });
  }, [selectedNode]);

  const handleChangeCollectionData = (value: string | null) => {
    if (!value) return;
    setConfig({
      ...config,
      targetCollection: value,
    });

    if (!value) return;

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as PaginationNode;
        const writable = node.getWritable();
        writable.setConfig({
          ...writable.getConfig(),
          targetCollection: value,
        });

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

  const handleChangeClassName =
    (key: keyof PaginationClassNames) => (value: string[]) => {
      const classNames = { ...config.classNames, [key]: value.join(" ") };
      setConfig({ ...config, classNames });

      editor.update(
        () => {
          const node = selectedNode?.getLatest() as PaginationNode;
          const writable = node.getWritable();
          writable.setConfig({ ...writable.getConfig(), classNames });

          $syncParentCollections(writable);

          editor.dispatchCommand(NODE_PROPERTY_UPDATED, { node: writable });
        },
        { discrete: true }
      );
    };

  const handleChangeAdditionalQueryKeys = (keys: string[]) => {
    setConfig({ ...config, additionalQueryKeys: keys });

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as PaginationNode;
        const writable = node.getWritable();
        writable.setConfig({ ...writable.getConfig(), additionalQueryKeys: keys });

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, { node: writable });
      },
      { discrete: true }
    );
  };

  const handleChangeUrlType = (value: "none" | "query" | "segment") => {
    setConfig({
      ...config,
      urlType: value,
    });

    editor.update(
      () => {
        const node = selectedNode?.getLatest() as PaginationNode;
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

  if (!$isPaginationNode(selectedNode)) return null;

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
          <EmptyStateMessage message="No data collections defined. Please configure a Collection node with data fetching to enable pagination." />
        )}
        {collectionNames.length > 0 && (
          <SelectCollection
            value={config.targetCollection ?? null}
            onChange={handleChangeCollectionData}
            collectionNames={collectionNames}
          />
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
              label: "Query Parameter (?page=1)",
            },
            {
              value: "segment",
              label: "URL Segment (/1)",
            },
          ]}
          value={config.urlType ?? "none"}
        />
        <HelpText sx={{ mt: 0.5 }}>
          Select how the current page is represented in the URL
        </HelpText>
      </Box>
      <Box>
        <RightPanelSectionTitle title="Additional Query Keys" />
        <details style={{ marginBottom: 8 }}>
          <summary
            style={{
              fontSize: 10,
              color: "inherit",
              opacity: 0.6,
              cursor: "pointer",
              listStyle: "revert",
            }}>
            What are additional query keys?
          </summary>
          <HelpText sx={{ mt: 0.5 }}>
            By default, pagination sends only the current page number to the
            associated Data Fetching Node. If other nodes (e.g.{" "}
            <em>SearchBox</em>) are also tied to the same Data Fetching Node
            and store their own query keys in the shared cache (e.g.{" "}
            <em>search</em>), those values will be lost on page change unless
            listed here. Add each key so the combined query (e.g.{" "}
            <em>page + search</em>) is forwarded together.
          </HelpText>
        </details>
        <InputMultiple
          value={config.additionalQueryKeys ?? []}
          onChange={handleChangeAdditionalQueryKeys}
        />
      </Box>
      <Box>
        <RightPanelSectionTitle title="Additional Class Names" />
        {(
          [
            ["container", "Container", "Outermost wrapper div"],
            ["info", "Info", "Page info paragraph"],
            ["controls", "Controls", "Div wrapping all buttons"],
            ["button", "Button", "Prev, next, and page number buttons"],
            ["ellipsis", "Ellipsis", "Ellipsis span between page groups"],
          ] as [keyof PaginationClassNames, string, string][]
        ).map(([key, label, description]) => (
          <Box key={key} sx={{ mb: 1 }}>
            <Typography fontSize={11} fontWeight={600}>
              {label}
            </Typography>
            <InputMultiple
              value={
                config.classNames?.[key]
                  ? (config.classNames[key] as string)
                      .split(" ")
                      .filter(Boolean)
                  : []
              }
              onChange={handleChangeClassName(key)}
            />
            <HelpText>{description}</HelpText>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
