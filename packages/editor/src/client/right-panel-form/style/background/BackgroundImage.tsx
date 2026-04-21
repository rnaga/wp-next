import { useRef, useState } from "react";

import { Box } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { SortableList } from "@rnaga/wp-next-ui/SortableList";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { backgroundValueToCSSString } from "../../../../lexical/styles/background";
import type * as types from "../../../../types";
import { useStyleBackgroundContext } from "./StyleBackground";
import { useBackground } from "./use-background";

export const BackgroundImage = () => {
  const { onOpen, onEdit, onDelete, targetRef } = useStyleBackgroundContext();
  const { values: backgroundValues, findValue, updateValues } = useBackground();

  const handleChangeOrder = (newValues: types.CSSBackgroundImage[]) => {
    updateValues(newValues);
  };

  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      <Button
        ref={targetRef as any}
        size="small"
        onClick={() => onOpen()}
        sx={{
          width: "100%",
        }}
      >
        <Typography fontSize={10}>Add Image URL / Gradient</Typography>
      </Button>
      {backgroundValues && backgroundValues.length > 0 && (
        <SortableList
          enum={backgroundValues.map((value, index) => ({
            value,
            label: `${value.$type} `,
          }))}
          displayType="vertical"
          size="small"
          onChange={(newValues) => {
            handleChangeOrder(newValues.map((v) => v.value));
          }}
          onEdit={onEdit}
          onDelete={onDelete}
          renderItem={(item) => {
            const value = findValue(item.index);
            return !value ? (
              <></>
            ) : (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  py: 0.5,
                  px: 1,
                  gap: 1,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    background: backgroundValueToCSSString(value),
                    border: "1px solid #ccc",
                    ml: 1,
                  }}
                />
                <Typography>{item.label}</Typography>
              </Box>
            );
          }}
        />
      )}
    </Box>
  );
};
