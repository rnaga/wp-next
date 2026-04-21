import { useEffect, useState } from "react";

import { Box } from "@mui/material";

import { Button } from "@rnaga/wp-next-ui/Button";
import { MediaSelector } from "../../../forms/components/MediaSelector";
import { BackgroundOptions } from "./BackgroundOptions";
import { PreviewBox } from "./PreviewBox";
import { useStyleBackgroundContext } from "./StyleBackground";
import { useBackground } from "./use-background";

import type * as types from "../../../../types";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const Url = () => {
  const { itemIndex, onClose, onCancel } = useStyleBackgroundContext();
  const { addValue, updateValue, values, findValue } = useBackground();

  const [value, setValue] = useState<types.CSSBackgroundImageUrlValue>({
    $type: "url",
    imageUrl: undefined,
  });

  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );

  const updateUrlValue = (
    newValue: Pick<
      Partial<types.CSSBackgroundImageUrlValue>,
      "imageUrl" | "advancedOptions"
    >
  ) => {
    const combinedValue: types.CSSBackgroundImageUrlValue = {
      $type: "url",
      imageUrl: newValue.imageUrl ?? value.imageUrl,
      advancedOptions: {
        ...value.advancedOptions,
        ...newValue.advancedOptions,
      },
    };

    setValue(combinedValue);

    if (itemIndex !== undefined) {
      updateValue(itemIndex, combinedValue);
    }
  };

  const handleChange = (url: string | undefined) => {
    updateUrlValue({ imageUrl: url });

    if (itemIndex !== undefined) {
      const css = findValue(itemIndex);
      if (css && css.$type === "url") {
        updateValue(itemIndex, {
          ...css,
          imageUrl: url,
        });
      }
    }
  };

  const handleSubmit = () => {
    if (!value.imageUrl) {
      setErrorMessage("Image URL is required.");
      return;
    }

    if (itemIndex !== undefined) {
      updateValue(itemIndex, value);
    } else {
      addValue(value);
    }

    setErrorMessage(undefined);
    onClose();
  };

  const handleCancel = () => {
    setValue({ $type: "url", imageUrl: undefined });

    setErrorMessage(undefined);

    // Close the dialog or perform any other cleanup
    onCancel();
  };

  useEffect(() => {
    if (itemIndex === undefined) {
      return;
    }

    const css = findValue(itemIndex);

    if (css && css.$type === "url") {
      setValue(css);
    }
  }, [itemIndex, values]);

  return (
    <>
      <PreviewBox value={value} placeholder="No image URL added yet" />

      {errorMessage && (
        <Typography color="error" sx={{ my: 0.5 }}>
          {errorMessage}
        </Typography>
      )}

      <BackgroundOptions
        items={[
          {
            title: "Image URL",
            content: (
              <MediaSelector
                onChange={handleChange}
                mediaUrl={""}
                size="small"
              />
            ),
          },
        ]}
        value={value.advancedOptions}
        onChange={(advancedOptions) => {
          const newValue = {
            ...value,
            advancedOptions: {
              ...value.advancedOptions,
              ...advancedOptions,
            },
          };

          updateUrlValue(newValue);
        }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 1,
          mt: 1,
        }}
      >
        <Button size={"small"} onClick={handleSubmit}>
          Submit
        </Button>
        <Button size={"small"} color="error" onClick={handleCancel}>
          Cancel
        </Button>
      </Box>
    </>
  );
};
