import { Klass, LexicalNode } from "lexical";
import { useRef } from "react";

import { Box } from "@mui/material";

import { useDragDrop } from "../drag-drop";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const Draggable = (props: {
  klassNode: Klass<LexicalNode>;
  title: string;
  Icon: any;
}) => {
  const { klassNode, title, Icon } = props;
  const dragDrop = useDragDrop();
  const ref = useRef<HTMLDivElement>(null);

  return (
    <Box
      ref={ref}
      draggable
      onDragStart={(e) => {
        const event = e as unknown as DragEvent;

        dragDrop.setNewDragged(klassNode);
      }}
      onDragEnd={(e) => {
        dragDrop.end();
      }}
      sx={{
        cursor: "grab",
        //width: 80,
      }}
    >
      <Box
        sx={{
          p: 1,
          "&:hover": {
            backgroundColor: (theme) => theme.palette.grey[300],
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Icon
            fontSize="large"
            sx={{
              border: 1,
            }}
          />
        </Box>

        <Typography
          sx={{
            fontSize: 10,
            textAlign: "center",
            wordBreak: "break-word",
          }}
        >
          {title}{" "}
        </Typography>
      </Box>
    </Box>
  );
};
