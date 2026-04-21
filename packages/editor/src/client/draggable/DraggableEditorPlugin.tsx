import { useMemo } from "react";
import { Box } from "@mui/material";
import { Draggable } from "./Draggable";
import { useDraggable } from "./use-draggable";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import type * as types from "../../types";

const TYPE_ORDER: types.DraggableType[] = [
  "general",
  "media",
  "form",
  "data",
  "advanced",
];

const TYPE_LABELS: Record<types.DraggableType, string> = {
  general: "General",
  media: "Media",
  form: "Form",
  data: "Data",
  advanced: "Advanced",
};

export const DraggableEditorPlugin = () => {
  const { draggableElements } = useDraggable();

  const groupedElements = useMemo(() => {
    const groups = new Map<types.DraggableType, typeof draggableElements>();

    Array.from(draggableElements.entries()).forEach(([klassNode, value]) => {
      const type = value.type;
      if (!groups.has(type)) {
        groups.set(type, new Map());
      }
      groups.get(type)!.set(klassNode, value);
    });

    return TYPE_ORDER.filter((type) => groups.has(type)).map((type) => ({
      type,
      elements: groups.get(type)!,
    }));
  }, [draggableElements]);

  return (
    <Box sx={{ p: 1 }}>
      {groupedElements.map(({ type, elements }) => (
        <Box key={type} sx={{ mb: 0.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 0.5, px: 0.5 }} bold>
            {TYPE_LABELS[type]}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 0.5,
            }}
          >
            {Array.from(elements.entries())
              .sort(
                ([, firstElement], [, secondElement]) =>
                  (firstElement.priority ?? 0) - (secondElement.priority ?? 0)
              )
              .map(([klassNode, value]) => (
                <Draggable
                  key={klassNode.getType()}
                  klassNode={klassNode}
                  title={value.title}
                  Icon={value.icon}
                />
              ))}
          </Box>
        </Box>
      ))}
    </Box>
  );
};
