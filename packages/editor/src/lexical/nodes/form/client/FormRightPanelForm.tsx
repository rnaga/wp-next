import { HISTORY_MERGE_TAG } from "lexical";
import { useEffect, useRef, useState } from "react";
import { minify } from "terser";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, CircularProgress } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { HelpText } from "../../../../client/forms/components/HelpText";
import { RightPanelSectionTitle } from "../../../../client/forms/components/RightPanelSectionTitle";
import { useSelectedNode } from "../../../../client/global-event";
import { NODE_PROPERTY_UPDATED } from "../../../../client/node-event";
import { logger } from "../../../logger";
import { $walkNode } from "../../../walk-node";
import { $syncParentCollections } from "../../collection/CollectionNode";
import { DEFAULT_FORM_HANDLER } from "../constant";
import { $isFormHandlerNode } from "../FormHandlerNode";
import { $initializeFormScaffolding, $isFormNode } from "../FormNode";
import { $getMessageNode } from "../input";
import {
  createTypeScriptScaffolding,
  createWpEventOnlyCode,
  transpileTypeScriptToJavaScript,
} from "../scaffolding";
import { DraggableSubmitHandler } from "./DraggableSubmitHandler";
import { FormEditorContext, useFormEditor } from "./FormEditorContext";
import { InputListPanel } from "./InputListPanel";

const FormRightPanelFormContent = (props: { children?: React.ReactNode }) => {
  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const [open, setOpen] = useState(false);
  const [showMessageBox, setShowMessageBox] = useState(false);
  const [formHandlerTypes, setFormHandlerTypes] = useState<
    { name: string; description: string }[]
  >([DEFAULT_FORM_HANDLER]);
  const [formHandlerType, setFormHandlerType] = useState<string>("default");

  const targetRef = useRef<HTMLButtonElement>(null);
  const {
    editorRef,
    formConfig,
    setFormConfig,
    originalConfig,
    setOriginalConfig,
    isUpdatingHandler,
    setIsUpdatingHandler,
    rebuildTypeScriptScaffolding,
  } = useFormEditor();

  useEffect(() => {
    // Load form config
    if (!$isFormNode(selectedNode)) {
      return;
    }

    editor.read(() => {
      const config = selectedNode.getConfig();
      const defaultConfig = { action: "", method: "POST" as const };
      const loadedConfig = config ?? defaultConfig;
      setFormConfig(loadedConfig);
      setOriginalConfig(loadedConfig);
      setFormHandlerType(selectedNode.getFormHandlerType());
    });

    // Check if message box is visible
    const messageNode = editor.read(() => $getMessageNode(selectedNode));
    if (!messageNode) {
      setShowMessageBox(false);
      return;
    }
    const isVisible = editor.read(
      () => messageNode.__css.get().display !== "none"
    );
    setShowMessageBox(isVisible);
  }, [selectedNode]);

  // Load Custom Form Hander Names
  useEffect(() => {
    const handlerNames = wpHooks.filter.apply("next_editor_form_handler_name", [
      DEFAULT_FORM_HANDLER,
    ]);
    logger.debug("Form handler names:", handlerNames);
    setFormHandlerTypes(handlerNames);
  }, []);

  const handleShowMessageBoxChange = () => {
    if (!$isFormNode(selectedNode)) {
      return;
    }

    // Get message (TemplateTextNode)
    const messageNode = editor.read(() => $getMessageNode(selectedNode));
    if (!messageNode) {
      return;
    }
    const isVisible = messageNode.__css.get().display !== "none";

    editor.update(
      () => {
        const messageNodeWritable = messageNode.getWritable();
        messageNodeWritable.__css.set({
          display: isVisible ? "none" : "block",
        });
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    setShowMessageBox(!isVisible);
  };

  const handleConfigChange = (
    field: "action" | "redirectUrl" | "method",
    value: string | undefined
  ) => {
    if (!$isFormNode(selectedNode)) {
      return;
    }
    const newConfig = { ...formConfig, [field]: value };
    setFormConfig(newConfig);

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.setConfig(newConfig);

        // Dispatch NODE_PROPERTY_UPDATED to notify listeners
        editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
          node: writable,
        });
      },
      {
        discrete: true,
      }
    );

    // Rebuild TypeScript scaffolding to reflect config changes
    rebuildTypeScriptScaffolding();
  };

  const hasConfigChanges = () => {
    return (
      formConfig.action !== originalConfig.action ||
      formConfig.redirectUrl !== originalConfig.redirectUrl
    );
  };

  const handleFormHandlerTypeChange = (newType: string) => {
    if (!$isFormNode(selectedNode)) {
      return;
    }

    setFormHandlerType(newType);

    editor.update(
      () => {
        const writable = selectedNode.getWritable();
        writable.setFormHandlerType(newType);

        // Sync formHandlerType into the child FormHandlerNode's config.
        $walkNode(writable, (node) => {
          if ($isFormHandlerNode(node)) {
            const handlerWritable = node.getWritable();
            handlerWritable.__config = {
              ...handlerWritable.__config,
              formHandlerType: newType,
            };
            return false;
          }
          return true;
        });

        if (newType !== "default") {
          // Replace the submit handler with the minimal wpEvent dispatcher.
          const formId = writable.getFormId();
          const jsCode = createWpEventOnlyCode(formId);
          writable.setSubmitHandler({
            typescriptFunction: "",
            jsFunction: jsCode,
          });
        } else {
          // Reset to default scaffolding — clear first so $initializeFormScaffolding runs.
          writable.setSubmitHandler(undefined);
          $initializeFormScaffolding(writable);
        }

        editor.dispatchCommand(NODE_PROPERTY_UPDATED, { node: writable });
      },
      { discrete: true, tag: HISTORY_MERGE_TAG }
    );
  };

  const handleUpdateSubmitHandler = async () => {
    if (!$isFormNode(selectedNode)) {
      return;
    }

    setIsUpdatingHandler(true);

    try {
      const formId = editor.read(() => selectedNode.getFormId());
      const latestNode = editor.read(() => selectedNode.getLatest());
      const messageClassName = editor.read(() =>
        latestNode.getMessageClassName()
      );

      // Get current submit handler (which contains only the user's code body)
      const currentHandler = editor.read(() => latestNode.getSubmitHandler());

      // Wrap the user's code body with updated config scaffolding
      const fullTsCode = createTypeScriptScaffolding(
        formConfig,
        messageClassName,
        currentHandler?.typescriptFunction // User's code body
      );

      // Transpile to JavaScript
      const { jsCode, error } = transpileTypeScriptToJavaScript(
        fullTsCode,
        formId
      );

      if (error || !jsCode) {
        logger.error("Failed to transpile:", error);
        setIsUpdatingHandler(false);
        return;
      }

      // Minify JavaScript
      const minifyResult = await minify(jsCode, {
        compress: {
          dead_code: true,
          drop_console: false,
          drop_debugger: true,
          keep_classnames: false,
          keep_fargs: true,
          keep_fnames: false,
          keep_infinity: false,
        },
        mangle: {
          keep_classnames: false,
          keep_fnames: false,
        },
        format: {
          comments: false,
        },
      });

      if (!minifyResult.code) {
        logger.error("Minification failed: no output code");
        setIsUpdatingHandler(false);
        return;
      }

      // Update the form node with new handler
      editor.update(
        () => {
          if (!$isFormNode(latestNode)) return;

          const writable = latestNode.getWritable();
          writable.setSubmitHandler({
            // Keep the user's code body unchanged
            typescriptFunction: currentHandler?.typescriptFunction || "",
            jsFunction: minifyResult.code!,
          });

          // Now use editorRef to update value in Code Editor
          if (editorRef.current) {
            const codeEditor = editorRef.current.getModel();
            if (codeEditor) {
              codeEditor.setValue(currentHandler?.typescriptFunction || "");
            }
          }
        },
        {
          discrete: true,
          tag: HISTORY_MERGE_TAG,
        }
      );

      // Update original config to match current
      setOriginalConfig(formConfig);
    } catch (error) {
      logger.error("Error updating submit handler:", error);
    } finally {
      setIsUpdatingHandler(false);
    }
  };

  if (!selectedNode || !$isFormNode(selectedNode)) return null;

  return (
    <Box
      sx={{
        mx: 2,
        mt: 1,
        mb: 20,
      }}
    >
      <DraggableSubmitHandler
        open={open}
        onClose={() => setOpen(false)}
        targetRef={targetRef}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "flex-start",
          mb: 1,
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Box sx={{ width: "100%" }}>
          <RightPanelSectionTitle title="Form Handler" />
          <Select
            value={formHandlerType}
            onChange={handleFormHandlerTypeChange}
            enum={formHandlerTypes.map((type) => ({
              value: type.name,
              label:
                type.name.charAt(0).toUpperCase() +
                type.name.slice(1).replace(/_/g, " "),
            }))}
          />
          {formHandlerTypes.find((t) => t.name === formHandlerType)
            ?.description && (
            <HelpText sx={{ mt: 0.5 }}>
              {
                formHandlerTypes.find((t) => t.name === formHandlerType)!
                  .description
              }
            </HelpText>
          )}
        </Box>

        {formHandlerType === "default" && (
          <Box sx={{ width: "100%" }}>
            <RightPanelSectionTitle title="Form Configuration" />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <Box>
                <Typography fontSize={12} sx={{ mb: 0.5 }}>
                  Action URL
                </Typography>
                <Input
                  value={formConfig.action}
                  onChange={(value) => handleConfigChange("action", value)}
                  size="small"
                  placeholder="e.g., /api/submit"
                  sx={{ width: "100%" }}
                />
              </Box>
              <Box>
                <Typography fontSize={12} sx={{ mb: 0.5 }}>
                  Redirect URL (after submission)
                </Typography>
                <Input
                  value={formConfig.redirectUrl || ""}
                  onChange={(value) =>
                    handleConfigChange("redirectUrl", value || undefined)
                  }
                  size="small"
                  placeholder="e.g., /thank-you"
                  sx={{ width: "100%" }}
                />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                <Button
                  size="small"
                  onClick={handleUpdateSubmitHandler}
                  disabled={!hasConfigChanges() || isUpdatingHandler}
                >
                  {isUpdatingHandler ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1 }} />
                      Updating...
                    </>
                  ) : (
                    "Update Submit Handler"
                  )}
                </Button>
              </Box>
            </Box>
          </Box>
        )}

        <Box sx={{ width: "100%" }}>
          <RightPanelSectionTitle title="Message Box" />
          <Button
            size="small"
            onClick={handleShowMessageBoxChange}
            sx={{ width: "100%" }}
          >
            <Typography size="small">
              {showMessageBox ? "Hide" : "Show"} Message Box
            </Typography>
          </Button>
          <HelpText sx={{ mt: 0.5 }}>
            Shows messages after submission when no redirect URL is set
          </HelpText>
        </Box>

        {formHandlerType === "default" && (
          <Box sx={{ width: "100%" }}>
            <RightPanelSectionTitle title="Submit Handler" />
            <Button
              ref={targetRef as any}
              size="small"
              onClick={() => setOpen(true)}
              sx={{ width: "100%" }}
            >
              <Typography size="small">Configure Submit Handler</Typography>
            </Button>
            <HelpText sx={{ mt: 0.5 }}>
              Write TypeScript code for form submission
            </HelpText>
          </Box>
        )}

        <InputListPanel formNodeOrFieldSetNode={selectedNode} />

        {props.children}
      </Box>
    </Box>
  );
};

export const FormRightPanelForm = (props: { children?: React.ReactNode }) => {
  return (
    <FormEditorContext>
      <FormRightPanelFormContent {...props} />
    </FormEditorContext>
  );
};
