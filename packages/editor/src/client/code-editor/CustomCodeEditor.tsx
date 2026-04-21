import { useRef, useState } from "react";
import CodeEditor, { type EditorProps } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import { logger } from "../../lexical/logger";

export interface CustomCodeEditorProps extends Omit<EditorProps, "onChange"> {
  initialValue?: string;
  onChange?: (value: string) => void;
  protectLineStart?: string;
  protectLineEnd?: string;
  protectLineNumber?: number;
  protectLastLine?: boolean;
  onErrorMessage?: (message: string) => void;
}

export const CustomCodeEditor = (props: CustomCodeEditorProps) => {
  const {
    initialValue,
    onChange,
    protectLineStart,
    protectLineEnd,
    protectLineNumber,
    protectLastLine,
    onErrorMessage,
    onMount,
    ...monacoEditorProps
  } = props;

  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const handleEditorMount = (
    monacoEditor: editor.IStandaloneCodeEditor,
    monaco: any
  ) => {
    editorRef.current = monacoEditor;
    const model = monacoEditor.getModel();

    if (!model) {
      logger.error("Monaco editor model is null");
      return;
    }

    // Use a ref to track the previous value in the closure
    let isFormatting = false;
    let isOnProtectedLine = false;

    // Find the FIRST occurrence of protected marker lines
    const findProtectedLineNumbers = (): {
      startLine: number;
      endLine: number;
    } => {
      const totalLines = model.getLineCount();
      let startLine = -1;
      let endLine = -1;

      for (let i = 1; i <= totalLines; i++) {
        const lineContent = model.getLineContent(i);
        if (
          protectLineStart &&
          startLine === -1 &&
          lineContent.includes(protectLineStart)
        ) {
          startLine = i;
        } else if (
          protectLineEnd &&
          startLine !== -1 &&
          lineContent.includes(protectLineEnd)
        ) {
          endLine = i;
          break; // Stop at first protectLineEnd after finding protectLineStart
        }
      }

      return { startLine, endLine };
    };

    // Check if cursor is on a protected line (first occurrence only)
    const checkCursorOnProtectedLine = (): boolean => {
      const position = monacoEditor.getPosition();
      if (!position) return false;

      // Check protectLineNumber - protect lines from 0 to protectLineNumber
      if (
        protectLineNumber !== undefined &&
        position.lineNumber <= protectLineNumber
      ) {
        return true;
      }

      // Check protectLastLine - protect the last line and below
      if (protectLastLine) {
        const totalLines = model.getLineCount();
        if (position.lineNumber >= totalLines) {
          return true;
        }
      }

      // Check marker-based protection (only if markers are configured)
      if (protectLineStart && protectLineEnd) {
        const { startLine, endLine } = findProtectedLineNumbers();
        if (startLine !== -1 && endLine !== -1) {
          return (
            position.lineNumber <= startLine || position.lineNumber >= endLine
          );
        }
      }

      // If none of the protection conditions are met, line is editable
      return false;
    };

    // Update editor readonly state based on cursor position
    const updateReadOnlyState = () => {
      const onProtected = checkCursorOnProtectedLine();
      if (onProtected === isOnProtectedLine) {
        return;
      }

      isOnProtectedLine = onProtected;
      monacoEditor.updateOptions({ readOnly: onProtected });

      // Show custom error message when on protected line
      if (onProtected) {
        const position = monacoEditor.getPosition();
        let message = "";

        if (
          protectLineNumber !== undefined &&
          position &&
          position.lineNumber <= protectLineNumber
        ) {
          message = `Cannot edit this line. Lines 1-${protectLineNumber} are protected.`;
        } else if (
          protectLastLine &&
          position &&
          position.lineNumber >= model.getLineCount()
        ) {
          message = `Cannot edit this line. The last line is protected.`;
        } else {
          message = `Cannot edit this line. The ${protectLineStart} and ${protectLineEnd} markers are protected.`;
        }

        onErrorMessage?.(message);
      } else {
        onErrorMessage?.("");
      }
    };

    // Ensure there's always a newline for editing
    const ensureNewlineInFunction = (functionValue: string): string => {
      const lines = functionValue.split("\n");
      if (lines.length < 3) {
        // If function is on single line or two lines, add newlines
        const firstLine = lines[0];
        const lastLine = lines[lines.length - 1];
        return `${firstLine}\n  // Add code here\n${lastLine}`;
      }
      return functionValue;
    };

    // Ensure editable space when both protectLineNumber and protectLastLine are set
    const ensureEditableSpace = (value: string): string => {
      if (!protectLineNumber || !protectLastLine) {
        return value;
      }

      const lines = value.split("\n");
      const totalLines = lines.length;

      // Check if there's at least one editable line between protected lines
      const editableLines = totalLines - protectLineNumber - 1;

      if (editableLines < 1) {
        // Insert blank line to ensure at least one editable line
        // For single line like ".pkasbpc {}", we need to split it properly
        if (totalLines === 1) {
          // Split the single line into first line and last line (opening and closing braces)
          const singleLine = lines[0];
          const match = singleLine.match(/^(.+\{)\s*(\}.*)$/);
          if (match) {
            return `${match[1]}\n\n${match[2]}`;
          }
        }

        // For multi-line case, insert blank line between protected regions
        const protectedStart = lines.slice(0, protectLineNumber);
        const protectedEnd = lines.slice(totalLines - 1); // Last line only
        return [...protectedStart, "", ...protectedEnd].join("\n");
      }

      return value;
    };

    // Listen for cursor position changes
    monacoEditor.onDidChangeCursorPosition(() => {
      if (isFormatting) return;
      updateReadOnlyState();
    });

    // Format the document first and wait for it to complete
    setTimeout(() => {
      isFormatting = true;

      // Only use ensureNewlineInFunction for protectLineStart/End (JavaScript/TypeScript code)
      // Skip for protectLineNumber/protectLastLine (CSS/other languages)
      const shouldEnsureNewline = !protectLineNumber && !protectLastLine;

      // First ensure newline for JS/TS code (before formatting)
      if (shouldEnsureNewline) {
        const valueWithNewline = ensureNewlineInFunction(model.getValue());
        if (valueWithNewline !== model.getValue()) {
          model.setValue(valueWithNewline);
        }
      }

      monacoEditor
        .getAction("editor.action.formatDocument")
        ?.run()
        .then(() => {
          // Store initial value after formatting
          let formattedInitialValue = model.getValue();

          // Ensure editable space after formatting (for CSS/other languages)
          // Only call this ONCE after formatting
          if (protectLineNumber !== undefined && protectLastLine) {
            formattedInitialValue = ensureEditableSpace(formattedInitialValue);
            if (formattedInitialValue !== model.getValue()) {
              model.setValue(formattedInitialValue);
            }
          }

          // Ensure newline after formatting (only for JS/TS code)
          if (shouldEnsureNewline) {
            formattedInitialValue = ensureNewlineInFunction(
              formattedInitialValue
            );
            if (formattedInitialValue !== model.getValue()) {
              model.setValue(formattedInitialValue);
            }
          }

          // Update parent component with formatted value
          if (onChange) {
            onChange(model.getValue());
          }

          isFormatting = false;

          // Move cursor to first editable line
          if (protectLineNumber !== undefined) {
            // For protectLineNumber, move to the line after the protected line
            monacoEditor.setPosition({
              lineNumber: protectLineNumber + 1,
              column: 1,
            });
            monacoEditor.focus();
          } else {
            // For protectLineStart/End, move to after the start marker
            const { startLine } = findProtectedLineNumbers();
            if (startLine !== -1) {
              monacoEditor.setPosition({
                lineNumber: startLine + 1,
                column: 1,
              });
              monacoEditor.focus();
            }
          }

          // Set initial readonly state
          updateReadOnlyState();
          setIsInitialized(true);
        });
    }, 0);

    // Listen for content changes
    if (onChange) {
      model.onDidChangeContent(() => {
        // Skip onChange during initial formatting to avoid duplicates
        if (isFormatting) return;
        onChange(model.getValue());
      });
    }

    // Call the original onMount callback if provided
    if (onMount) {
      onMount(monacoEditor, monaco);
    }
  };

  return (
    <CodeEditor
      {...monacoEditorProps}
      value={initialValue}
      onMount={handleEditorMount}
    />
  );
};
