import { useState } from "react";
import { CustomCodeEditor } from "../../../../client/code-editor";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Box, Alert, CircularProgress } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useSelectedNode } from "../../../../client/global-event";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $isFormNode } from "../FormNode";
import { minify } from "terser";
import {
  transpileTypeScriptToJavaScript,
  extractEditableBody,
} from "../scaffolding";
import { useFormEditor } from "./FormEditorContext";
import { HISTORY_MERGE_TAG } from "lexical";
import { logger } from "../../../logger";

const MIN_HEIGHT_EDITOR = 400;

export const DraggableSubmitHandler = (props: {
  open: boolean;
  onClose: () => void;
  targetRef?: React.RefObject<HTMLElement | null>;
}) => {
  const { open, onClose, targetRef } = props;
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const { typescriptCode, setTypescriptCode, editorRef } = useFormEditor();
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isTranspiling, setIsTranspiling] = useState<boolean>(false);
  const [isDiff, setIsDiff] = useState<boolean>(true);
  const [currentCode, setCurrentCode] = useState<string>(typescriptCode);
  const [editorHeight, setEditorHeight] = useState<number>(MIN_HEIGHT_EDITOR);

  const handleCodeChange = (value: string) => {
    setCurrentCode(value);
    setIsDiff(value !== typescriptCode);
  };

  const handleEditorMount = (monacoEditor: any) => {
    editorRef.current = monacoEditor;
  };

  const minifyJavaScript = async (jsCode: string): Promise<string | null> => {
    try {
      const result = await minify(jsCode, {
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

      if (result.code === undefined) {
        setErrorMessage("Minification failed: no output code");
        return null;
      }

      return result.code;
    } catch (error) {
      setErrorMessage(
        `Minification error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return null;
    }
  };

  const handleUpdate = async () => {
    if (!selectedNode || !$isFormNode(selectedNode)) {
      setErrorMessage("No form node selected");
      return;
    }

    setIsTranspiling(true);
    setErrorMessage("");

    // Get the form ID from the node
    const formId = editor.read(() => selectedNode.getFormId());

    // Get current editor value
    const currentEditorValue = currentCode;

    // Extract only the user's editable code body (between // start and // end)
    const userCodeBody = extractEditableBody(currentEditorValue);

    // Transpile the full TypeScript code to JavaScript
    const transpileResult = transpileTypeScriptToJavaScript(
      currentEditorValue,
      formId
    );

    if (transpileResult.error) {
      setErrorMessage(transpileResult.error);
      setIsTranspiling(false);
      return;
    }

    // Minify JavaScript
    const minifiedCode = await minifyJavaScript(transpileResult.jsCode);
    if (minifiedCode === null) {
      setIsTranspiling(false);
      logger.warn( "Minification failed, aborting update.");
      return;
    }

    // Update the FormNode with user code body and minified JavaScript
    editor.update(
      () => {
        if (!$isFormNode(selectedNode)) return;

        const writable = selectedNode.getWritable();
        writable.setSubmitHandler({
          // Store only the user's editable code body
          typescriptFunction: userCodeBody,
          jsFunction: minifiedCode,
        });
      },
      {
        discrete: true,
        tag: HISTORY_MERGE_TAG,
      }
    );

    setTypescriptCode(currentEditorValue);
    setIsTranspiling(false);
    setIsDiff(false);
  };

  if (!selectedNode || !$isFormNode(selectedNode)) {
    return null;
  }

  return (
    <DraggableBox
      onClose={onClose}
      open={open}
      targetRef={targetRef}
      title="Submit Handler (TypeScript)"
      resizable
      sx={{
        minWidth: 700,
        minHeight: MIN_HEIGHT_EDITOR + 100,
      }}
      onResize={(width, height) => {
        // Calculate editor height: DraggableBox height - header (30px) - padding (8px top + 8px bottom) - gap (8px) - button area (~40px)
        const calculatedHeight = height - 30 - 16 - 8 - 40;
        setEditorHeight(Math.max(MIN_HEIGHT_EDITOR, calculatedHeight));
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Box
          sx={{
            height: editorHeight,
          }}
        >
          <CustomCodeEditor
            options={{
              padding: { bottom: 0 },
              autoIndent: "advanced",
              formatOnPaste: true,
              formatOnType: true,
              minimap: { enabled: false },
              lineNumbers: "on",
              scrollBeyondLastLine: false,
            }}
            height={editorHeight}
            defaultLanguage="typescript"
            initialValue={typescriptCode}
            onChange={handleCodeChange}
            onMount={handleEditorMount}
            onErrorMessage={setErrorMessage}
            protectLineStart="// start"
            protectLineEnd="// end"
          />
        </Box>
        {errorMessage && (
          <Box sx={{ mb: 1 }}>
            <Alert
              severity="error"
              sx={{
                fontSize: 12,
              }}
            >
              {errorMessage}
            </Alert>
          </Box>
        )}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
          }}
        >
          <Button
            size="small"
            onClick={handleUpdate}
            disabled={isTranspiling || errorMessage !== "" || isDiff === false}
          >
            {isTranspiling ? (
              <>
                <CircularProgress size={16} sx={{ mr: 1 }} />
                Transpiling & Minifying...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </Box>
      </Box>
    </DraggableBox>
  );
};
