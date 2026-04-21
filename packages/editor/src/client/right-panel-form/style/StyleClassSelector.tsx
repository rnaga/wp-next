import { COMMAND_PRIORITY_HIGH, HISTORY_MERGE_TAG } from "lexical";
import { useEffect, useMemo, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import CodeIcon from "@mui/icons-material/Code";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";

import { CSS_EDITOR_CONFIG_DISABLE_EXTERNAL_CLASS_NAMES } from "../../../lexical/constants";
import { CSS_EXTERNAL_CLASS_NAMES_KEY } from "../../../lexical/styles-core/constants";
import {
  ButtonGroup,
  FormFlexBox,
  FormStyleControl,
} from "../../forms/components";
import { useSelectedNode } from "../../global-event";
import { useElementState } from "../ElementStateContext";
import { StyleViewer } from "./StyleViewer";
import { useStyleForm } from "./use-style-form";
import { NODE_CSS_UPDATED_COMMAND } from "../../../lexical/commands";

import type * as types from "../../../types";

export const StyleClassSelector = () => {
  const { selectedNode } = useSelectedNode();
  const [openCodeViewer, setOpenCodeViewer] = useState(false);
  const [editor] = useLexicalComposerContext();

  const { formDataRef, updateFormData } = useStyleForm();
  const { elementState, updateElementState } = useElementState();
  const [externalClassNames, setExternalClassNames] = useState<string[]>([]);
  const [externalClassNamesDisabled, setExternalClassNamesDisabled] =
    useState(false);

  const handleChangeMultiple = (name: string) => (value: string[]) => {
    // Normalize class names:
    // - Trim leading/trailing whitespace from each entry
    // - Split space-separated entries into individual tokens
    // - Filter out empty strings
    // - Deduplicate via Set
    const processedClassNames = Array.from(
      new Set(
        value
          .map((className) => className.trim().split(" "))
          .flat()
          .filter((className) => className.length > 0)
      )
    );

    const newFormData = {
      [name]: processedClassNames,
    };

    updateFormData(newFormData);
    setExternalClassNames(processedClassNames);

    // When all class names are cleared, reset the disabled toggle so the icon
    // and grey background disappear — there's nothing to disable anymore.
    if (processedClassNames.length === 0 && externalClassNamesDisabled) {
      editor.update(
        () => {
          selectedNode
            ?.getWritable()
            .__css.setEditorModeConfig(
              CSS_EDITOR_CONFIG_DISABLE_EXTERNAL_CLASS_NAMES,
              false
            );
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );
      setExternalClassNamesDisabled(false);
    }
  };

  const handleChangeElementState = (value: string | undefined) => {
    value && updateElementState(value as types.CSSState);
  };

  const updateExternalClassNames = () => {
    const css = editor.read(() => selectedNode?.getLatest().__css.get());

    // External class names are persisted as a single space-separated string (e.g. "foo bar baz").
    // split(" ") converts it to an array so the UI can work with individual class entries.
    // The subsequent filter removes any empty strings that result from leading/trailing spaces
    // or consecutive spaces in the stored value.
    const currentExternalClassNames = (
      css?.[CSS_EXTERNAL_CLASS_NAMES_KEY]?.split(" ") ?? []
    ).filter((c: string) => c.trim().length > 0);

    setExternalClassNames(currentExternalClassNames);
  };

  useEffect(() => {
    if (!selectedNode) return;

    updateExternalClassNames();

    // Read the editor config flag that controls whether external class names are disabled.
    // This flag is toggled via an icon button in the UI (intended for debugging) and,
    // when set, hides the external class name input so only internal styles are applied.
    const disabled = editor.read(
      () =>
        !!selectedNode
          .getLatest()
          .__css.getEditorModeConfig(
            CSS_EDITOR_CONFIG_DISABLE_EXTERNAL_CLASS_NAMES
          )
    );

    setExternalClassNamesDisabled(disabled);

    // Listen for NODE_CSS_UPDATED_COMMAND to sync external class names
    // when styles change via mouse or keyboard (including undo/redo key events).
    return editor.registerCommand(
      NODE_CSS_UPDATED_COMMAND,
      ({ styles, type }) => {
        if (type !== "mouse" && type !== "keyboard") {
          return false;
        }

        updateExternalClassNames();

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode]);

  const handleToggleExternalClassNames = () => {
    if (!selectedNode) return;
    const next = !externalClassNamesDisabled;
    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.__css.setEditorModeConfig(
          CSS_EDITOR_CONFIG_DISABLE_EXTERNAL_CLASS_NAMES,
          next
        );
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );
    setExternalClassNamesDisabled(next);
  };

  if (!selectedNode) {
    return null;
  }

  return (
    <>
      <StyleViewer
        open={openCodeViewer}
        onClose={() => setOpenCodeViewer(false)}
      />
      <FormFlexBox>
        <FormStyleControl title="Additional Class Names" width="100%">
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                flex: 1,
                ...(externalClassNamesDisabled && {
                  backgroundColor: "grey.200",
                  borderRadius: 1,
                }),
              }}
            >
              <InputMultiple
                onChange={handleChangeMultiple(CSS_EXTERNAL_CLASS_NAMES_KEY)}
                value={externalClassNames}
              />
            </Box>
            {(externalClassNamesDisabled || externalClassNames.length > 0) && (
              <Tooltip
                title={
                  externalClassNamesDisabled
                    ? "Enable external class names"
                    : "Disable external class names"
                }
                placement="top"
              >
                <IconButton
                  size="small"
                  onClick={handleToggleExternalClassNames}
                >
                  {externalClassNamesDisabled ? (
                    <VisibilityOffIcon sx={{ fontSize: 15 }} />
                  ) : (
                    <VisibilityIcon sx={{ fontSize: 15 }} />
                  )}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Element State" width="100%">
          <ButtonGroup
            value={elementState}
            onChange={handleChangeElementState}
            enum={[
              { value: "none", label: "None" },
              { value: "hover", label: "Hover" },
              { value: "active", label: "Active" },
              { value: "focus", label: "Focus" },
              { value: "visited", label: "Visited" },
            ]}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Class Name" width="100%">
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Input
              value={selectedNode.__css.getClassName()}
              //onBlur={handleClassNameBlur}
              readOnly
              sx={{
                flex: 1,
                flexGrow: 1,
              }}
            />
            <Tooltip title="Open CSS Viewer" placement="top-start">
              <IconButton onClick={() => setOpenCodeViewer(true)}>
                <CodeIcon
                  sx={{
                    fontSize: 15,
                  }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};
