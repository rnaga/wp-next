import { useEffect, useRef, useState } from "react";
import { Alert, Box, IconButton, Tooltip } from "@mui/material";
import ClearIcon from "@mui/icons-material/Clear";
import { Button } from "@rnaga/wp-next-ui/Button";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { HelpText } from "../../forms/components/HelpText";
import { CustomCodeEditor } from "../../code-editor/CustomCodeEditor";
import { parseCSSToJSON } from "../../../lexical/styles/parse-css-to-json";

/**
 * Builds a CSS block string with the class name wrapper suitable for display in
 * the code editor.  The CustomCodeEditor expects this format when using
 * protectLineNumber + protectLastLine so it can lock the opening/closing braces.
 *
 * When properties exist they are inlined; an empty wrapper is returned otherwise
 * so ensureEditableSpace in CustomCodeEditor can insert a blank editable line.
 */
const buildCSSWrapperText = (
  className: string,
  properties: Record<string, string> | undefined
): string => {
  if (!properties || Object.keys(properties).length === 0) {
    // Single-line empty block — CustomCodeEditor splits this into three lines automatically
    return `.${className} {}`;
  }

  const body = Object.entries(properties)
    .map(([prop, val]) => `  ${prop}: ${val};`)
    .join("\n");

  return `.${className} {\n${body}\n}`;
};

export const AnimationCustomProperties = (props: {
  // Class name of the source element — shown as the selector in the code editor wrapper
  className: string;
  value: Record<string, string> | undefined;
  onChange: (value: Record<string, string> | undefined) => void;
}) => {
  const { className, value, onChange } = props;
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // initialValue tracks the CSS wrapper text that was present when the panel opened.
  // We compare against it (not the prop) to decide whether to enable the Update button,
  // because Monaco formats the document on mount which changes currentText even without
  // user edits — using a stored-on-open snapshot avoids false "no changes" negatives.
  const [initialValue, setInitialValue] = useState<string>("");
  const [currentText, setCurrentText] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    if (open) {
      const wrapper = buildCSSWrapperText(className, value);
      setInitialValue(wrapper);
      setCurrentText(wrapper);
      setErrorMessage("");
    }
  }, [open]);

  const handleUpdate = () => {
    const parsed = parseCSSToJSON(currentText, { removeWrapper: true });

    if (Object.keys(parsed).length === 0) {
      onChange(undefined);
    } else {
      onChange(parsed);
    }

    setOpen(false);
  };

  const hasChanges = currentText !== initialValue;

  return (
    <>
      <DraggableBox
        open={open}
        onClose={() => setOpen(false)}
        targetRef={buttonRef}
        title="Animation Custom Properties"
        sx={{ width: 400 }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <HelpText>
            CSS properties injected into the animation rule block. Useful for
            styling pseudo-elements (e.g., content, position, inset for ::after
            overlays).
          </HelpText>
          <CustomCodeEditor
            options={{
              padding: { bottom: 0 },
              autoIndent: "advanced",
              formatOnPaste: true,
              formatOnType: true,
            }}
            height="220px"
            defaultLanguage="css"
            initialValue={initialValue}
            onChange={setCurrentText}
            // Protect the opening selector line and the closing brace so the user
            // only edits the property lines between them — mirrors StyleCustomProperties.
            protectLineNumber={1}
            protectLastLine={true}
            onErrorMessage={setErrorMessage}
          />
          {errorMessage && (
            <Alert severity="error" sx={{ fontSize: 12 }}>
              {errorMessage}
            </Alert>
          )}
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button
              size="small"
              onClick={handleUpdate}
              disabled={errorMessage !== "" || !hasChanges}
            >
              Update
            </Button>
          </Box>
        </Box>
      </DraggableBox>

      <Box sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <Button
            ref={buttonRef}
            size="small"
            onClick={() => setOpen(true)}
            sx={{ flex: 1 }}
          >
            {value && Object.keys(value).length > 0
              ? `Edit Custom Properties (${Object.keys(value).length})`
              : "Add Custom Properties"}
          </Button>
          {value && Object.keys(value).length > 0 && (
            <Tooltip title="Clear custom properties">
              <IconButton size="small" onClick={() => onChange(undefined)}>
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        <HelpText sx={{ mt: 0.5 }}>
          Extra CSS properties injected into the animation rule (e.g., content,
          position, border)
        </HelpText>
      </Box>
    </>
  );
};
