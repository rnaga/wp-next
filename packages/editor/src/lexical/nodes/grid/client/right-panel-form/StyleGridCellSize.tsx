import { useCallback, useEffect, useMemo, useState } from "react";

import {
  FormFlexBox,
  FormStyleControl,
} from "../../../../../client/forms/components";
import { Input } from "@rnaga/wp-next-ui/Input";
import { useStyleForm } from "../../../../../client/right-panel-form/style/use-style-form";
import { useSelectedNode } from "../../../../../client/global-event";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $isGridCellNode,
  $updateSpans,
  GridCellNode,
} from "../../GridCellNode";
import { NODE_PROPERTY_UPDATED } from "../../../../../client/node-event";
import { COMMAND_PRIORITY_HIGH } from "lexical";
import { $updateGridCellCSS, GridNode } from "../../GridNode";
import { Typography } from "@rnaga/wp-next-ui/Typography";

type Spans = {
  spanColumn: number;
  spanRow: number;
};

type FrsLength = {
  column: number;
  row: number;
};

export const StyleGridCellSize = () => {
  //const { formData, updateFormData } = useStyleForm();
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [spans, setSpans] = useState<Spans>({
    spanColumn: 1,
    spanRow: 1,
  });

  const [frsLength, setFrsLength] = useState<FrsLength>({
    column: 2,
    row: 2,
  });

  const [errors, setErrors] = useState<{
    spanColumn?: string;
    spanRow?: string;
  }>({
    spanColumn: undefined,
    spanRow: undefined,
  });

  useEffect(() => {
    if (!editor.read(() => $isGridCellNode(selectedNode))) {
      return;
    }
    editor.read(() => {
      const gridCellNode = selectedNode as GridCellNode;
      const spans = gridCellNode.getSpans();
      setSpans(spans);

      const gridNode = gridCellNode.getParent() as GridNode;
      const frs = gridNode.getFrs();
      setFrsLength({
        column: frs.frColumn.length,
        row: frs.frRow.length,
      });
    });
    return editor.registerCommand(
      NODE_PROPERTY_UPDATED,
      ({ node }) => {
        if (!$isGridCellNode(node)) {
          return false;
        }
        const gridCellNode = node as GridCellNode;
        const spans = gridCellNode.getSpans();
        setSpans(spans);
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode]);

  const handleChange = (spanKey: keyof Spans) => (value: string) => {
    const newSpan = parseInt(value);
    const maxSpan = spanKey === "spanColumn" ? frsLength.column : frsLength.row;

    if (isNaN(newSpan) || newSpan < 1 || newSpan > maxSpan) {
      setErrors({
        ...errors,
        [spanKey]: `Value must be between 1 and ${maxSpan}`,
      });
      return;
    }

    setErrors({
      ...errors,
      [spanKey]: undefined,
    });

    setSpans({
      ...spans,
      [spanKey]: newSpan,
    });

    editor.update(
      () => {
        const gridCellNode = selectedNode as GridCellNode;
        const writable = gridCellNode.getWritable();
        // writable.updateSpans({
        //   ...spans,
        //   [spanKey]: newSpan,
        // });
        $updateSpans(editor, writable, {
          ...spans,
          [spanKey]: newSpan,
        });
        $updateGridCellCSS(editor, writable);
      },
      {
        discrete: true,
      }
    );
  };

  return (
    <>
      <FormFlexBox>
        <FormStyleControl title="Column Span">
          <Input
            key="grid-span-column"
            type="number"
            onChange={handleChange("spanColumn")}
            value={spans.spanColumn}
          />
          {errors.spanColumn && (
            <Typography color="error">{errors.spanColumn}</Typography>
          )}
        </FormStyleControl>
        <FormStyleControl title="Row Span">
          <Input
            key="grid-span-row"
            onChange={handleChange("spanRow")}
            value={spans.spanRow}
            type="number"
          />
          {errors.spanRow && (
            <Typography color="error">{errors.spanRow}</Typography>
          )}
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};
