import { useEffect, useState } from "react";
import { DraggableBox } from "@rnaga/wp-next-ui/DraggableBox";
import { Box, Alert } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useSelectedNode } from "../../../global-event";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useStyleForm } from "../use-style-form";
import { CSS_CUSTOM_PROPERTIES_KEY } from "../../../../lexical/styles-core/constants";
import { CustomCodeEditor } from "../../../code-editor/CustomCodeEditor";
import { useElementState } from "../../ElementStateContext";
import { parseCSSToJSON } from "../../../../lexical/styles/parse-css-to-json";
import { encodeCustomProperties } from "../../../../lexical/styles/custom-properties";

export const DraggableCustomProperties = (props: {
  open: boolean;
  onClose: () => void;
  targetRef?: React.RefObject<HTMLElement | null>;
}) => {
  const { open, onClose, targetRef } = props;
  const [editor] = useLexicalComposerContext();
  const { elementState } = useElementState();
  const { selectedNode } = useSelectedNode();
  const { updateFormData, formKey } = useStyleForm();
  const [initialValue, setInitialValue] = useState<string>("");
  const [currentValue, setCurrentValue] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleUpdate = () => {
    const parsed = parseCSSToJSON(currentValue, { removeWrapper: true });

    if (Object.keys(parsed).length === 0) {
      updateFormData({
        [CSS_CUSTOM_PROPERTIES_KEY]: encodeCustomProperties({}),
      });
      return;
    }

    updateFormData({
      [CSS_CUSTOM_PROPERTIES_KEY]: encodeCustomProperties({
        $value: JSON.stringify(parsed),
      }),
    });

    setInitialValue(currentValue);
  };

  useEffect(() => {
    const customProperties = editor.read(() =>
      selectedNode?.getLatest().__css.customPropertyToString()
    );
    setInitialValue(customProperties ?? "");
    setCurrentValue(customProperties ?? "");
  }, [selectedNode, formKey, open]);

  if (!selectedNode || !initialValue) {
    return null;
  }

  return (
    <DraggableBox
      onClose={onClose}
      open={open}
      targetRef={targetRef}
      title="Custom Properties"
      sx={{
        width: 400,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Box>
          <CustomCodeEditor
            options={{
              padding: { bottom: 0 },
              autoIndent: "advanced",
              formatOnPaste: true,
              formatOnType: true,
            }}
            height="300px"
            defaultLanguage="css"
            initialValue={initialValue}
            onChange={setCurrentValue}
            protectLineNumber={1}
            protectLastLine={true}
            onErrorMessage={setErrorMessage}
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
            alignItems: "center",
            gap: 1,
          }}
        >
          <Button
            size="small"
            onClick={handleUpdate}
            disabled={
              errorMessage !== "" ||
              currentValue === initialValue ||
              currentValue == ""
            }
          >
            Update
          </Button>
        </Box>
      </Box>
    </DraggableBox>
  );
};
