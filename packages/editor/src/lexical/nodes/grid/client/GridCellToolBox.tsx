import { $addUpdateTag, $getNodeByKey, HISTORIC_TAG } from "lexical";
import { useEffect, useMemo, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, Tooltip } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useSelectedNode } from "../../../../client/global-event";
import { GridCellNode } from "../GridCellNode";
import MergeIcon from "@mui/icons-material/Merge";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlined";
import {
  $checkMergeableOnGridCell,
  $deleteGridColumn,
  $deleteGridRow,
  $expandGridCell,
  $getGridCellRange,
  $isGridNode,
  $mergeGridCell,
  $unmergeGridCell,
  $updateGridFrValueByCell,
  GridNode,
  Position,
} from "../GridNode";
import { useToolBox } from "../../../../client/mouse-tool/toolbox/ToolBoxContext";
import { useMouseTool } from "../../../../client/mouse-tool/MouseToolContext";
import { Portal } from "@rnaga/wp-next-ui/portal";
import { useBreakpoint } from "../../../../client/breakpoint";
import { logger } from "../../../logger";

type ButtonPosition = {
  top: number;
  left: number;
  transform: string;
  cursor: string;
};
type ButtonType = "merge" | "add";
type ButtonKey = "top" | "left" | "right" | "bottom";

const buttonOffsets = {
  merge: {
    right: { transform: "translate(100%, 0%)", cursor: "ew-resize" },
    left: { transform: "translate(-100%, 0%)", cursor: "ew-resize" },
    top: { transform: "translate(-50%, -100%)", cursor: "ns-resize" },
    bottom: { transform: "translate(-50%, 100%)", cursor: "ns-resize" },
  },
  add: {
    right: { transform: "translateY(0%)", cursor: "ew-resize" },
    left: { transform: "translateY(0%)", cursor: "ew-resize" },
    top: { transform: "translateX(-50%)", cursor: "ns-resize" },
    bottom: { transform: "translateX(-50%)", cursor: "ns-resize" },
  },
};

const getButtonPositions = (
  type: ButtonType,
  rect: DOMRect,
  scale: number
): Record<ButtonKey, ButtonPosition> => {
  const positions: Partial<Record<ButtonKey, ButtonPosition>> = {};
  if (!rect) return positions as Record<ButtonKey, ButtonPosition>;

  if (type === "merge") {
    positions.top = {
      top: -10 + rect.top * scale,
      left: rect.left * scale + (rect.width * scale) / 2,
      ...buttonOffsets.merge.top,
    };
    positions.left = {
      top: -10 + rect.top * scale + (rect.height * scale) / 2,
      left: -10 + rect.left * scale,
      ...buttonOffsets.merge.left,
    };
    positions.right = {
      top: -10 + rect.top * scale + (rect.height * scale) / 2,
      left: -11 + (rect.left + rect.width) * scale,
      ...buttonOffsets.merge.right,
    };
    positions.bottom = {
      top: -12 + (rect.top + rect.height) * scale,
      left: rect.left * scale + (rect.width * scale) / 2,
      ...buttonOffsets.merge.bottom,
    };

    return positions as Record<ButtonKey, ButtonPosition>;
  }

  positions.top = {
    top: -8 + rect.top * scale,
    left: rect.left * scale + (rect.width * scale) / 2,
    ...buttonOffsets.add.top,
  };
  positions.left = {
    top: -10 + rect.top * scale + (rect.height * scale) / 2,
    left: -9 + rect.left * scale,
    ...buttonOffsets.add.left,
  };
  positions.right = {
    top: -10 + rect.top * scale + (rect.height * scale) / 2,
    left: -11 + (rect.left + rect.width) * scale,
    ...buttonOffsets.add.right,
  };
  positions.bottom = {
    top: -12 + (rect.top + rect.height) * scale,
    left: rect.left * scale + (rect.width * scale) / 2,
    ...buttonOffsets.add.bottom,
  };

  return positions as Record<ButtonKey, ButtonPosition>;
};

// Merge and Add handlers for button actions
export const GridCellToolBox = () => {
  const handleMerge = (position: ButtonKey) => {
    const gridCellNode = editor.read(() =>
      $getNodeByKey(selectedNode!.getKey())
    ) as GridCellNode;
    editor.update(
      () => {
        $mergeGridCell(editor, gridCellNode, position as Position);
        settings.close();
      },
      { discrete: true }
    );
  };

  const handleAdd = (position: ButtonKey) => {
    const gridCellNode = editor.read(() =>
      $getNodeByKey(selectedNode!.getKey())
    ) as GridCellNode;
    editor.update(
      () => {
        //$addUpdateTag(HISTORIC_TAG);

        $expandGridCell(editor, gridCellNode, position as Position);
        settings.close();

        // $addUpdateTag(HISTORIC_TAG);
      },
      { discrete: true }
    );
  };
  const { selectedNode } = useSelectedNode();
  const [editor] = useLexicalComposerContext();
  const { wpHooks } = useWP();
  const { menus, settings, mouseHandlers } = useToolBox();
  const { canvasBoxRef } = useMouseTool();
  const { breakpointRef } = useBreakpoint();

  const [mergeable, setMergeable] = useState<string[]>([]);

  useEffect(() => {
    if (!selectedNode) {
      menus.reset();
      settings.disable();
      return;
    }

    if (selectedNode.getType() !== "grid-cell") {
      menus.reset();
      settings.disable();
      return;
    }

    const gridCellNode = editor.read(() =>
      $getNodeByKey(selectedNode.getKey())
    ) as GridCellNode;

    const newMenus: Parameters<typeof menus.set>[0] = [];

    const gridNode = editor
      .getEditorState()
      .read(() => selectedNode.getParents().find($isGridNode));

    if (!gridNode) {
      logger.warn( "Grid node not found");
      menus.reset();
      settings.disable();
      return;
    }

    // Check if the cell is spanned
    if (gridCellNode.__spanColumn > 1 || gridCellNode.__spanRow > 1) {
      newMenus.push([
        "Unmarge Cells",
        () => {
          editor.update(
            () => {
              $unmergeGridCell(editor, $getNodeByKey(gridCellNode.getKey())!);
              //refresh(["mousetool"]);
            },
            {
              discrete: true,
            }
          );
        },
      ]);
    }

    const cellRange = editor
      .getEditorState()
      .read(() => $getGridCellRange(gridCellNode));

    // Check if column fr is larger than 1
    if (gridNode.frColumn.length > 1) {
      // Get the index of the column fr on grid cell
      const columnFrIndex = cellRange.columnStart - 1;
      newMenus.push([
        "Delete Column",
        () => {
          editor.update(
            () => {
              $deleteGridColumn(editor, gridNode, columnFrIndex);
            },
            {
              discrete: true,
            }
          );
        },
      ]);
    }

    // Check if the row fr is larger than 1
    if (gridNode.frRow.length > 1) {
      // Get the index of the row fr on grid cell
      const rowFrIndex = cellRange.rowStart - 1;
      newMenus.push([
        "Delete Row",
        () => {
          editor.update(
            () => {
              $deleteGridRow(editor, gridNode, rowFrIndex);
            },
            {
              discrete: true,
            }
          );
        },
      ]);
    }

    // Update the menus or reset the menus
    newMenus.length > 0 ? menus.set(newMenus) : menus.reset();

    // Enable setting
    settings.enable();
  }, [selectedNode]);

  useEffect(() => {
    if (settings.isOpen && selectedNode?.getType() === "grid-cell") {
      updateMergeable();
    }
  }, [selectedNode, settings.isOpen]);

  const [rect, scale] = useMemo(() => {
    if (!selectedNode) return [null, 1];
    const targetElement = editor.read(() =>
      editor.getElementByKey(selectedNode.getKey())
    );
    return [
      targetElement?.getBoundingClientRect() || null,
      breakpointRef.current.scale || 1,
    ];
  }, [selectedNode, breakpointRef.current.scale]);

  const mergeButtonPositions = useMemo(() => {
    if (!rect) return [];
    const all = getButtonPositions("merge", rect, scale);
    return mergeable
      .map(
        (key) =>
          [key as ButtonKey, all[key as ButtonKey]] as [
            ButtonKey,
            ButtonPosition,
          ]
      )
      .filter(([, v]) => v);
  }, [rect, scale, mergeable]);

  const addButtonPositions = useMemo(() => {
    if (!rect) return [];
    const all = getButtonPositions("add", rect, scale);
    return Object.entries(all) as [ButtonKey, ButtonPosition][];
  }, [rect, scale]);

  const updateMergeable = () => {
    if (!selectedNode) return;
    const gridCellNode = editor.read(() =>
      selectedNode.getLatest()
    ) as GridCellNode;
    const mergeableDirs = editor.read(() =>
      $checkMergeableOnGridCell(gridCellNode)
    );
    setMergeable(mergeableDirs);
  };

  if (!settings.isOpen) return null;

  return (
    <>
      {mergeButtonPositions.map(([key, pos]) => (
        <RenderButton
          key={key}
          keyName={key}
          pos={pos}
          type="merge"
          handleMerge={handleMerge}
          handleAdd={handleAdd}
          canvasBoxRef={canvasBoxRef}
        />
      ))}
      {addButtonPositions.map(([key, pos]) => (
        <RenderButton
          key={key}
          keyName={key}
          pos={pos}
          type="add"
          handleMerge={handleMerge}
          handleAdd={handleAdd}
          canvasBoxRef={canvasBoxRef}
        />
      ))}
    </>
  );
};

const RenderButton = (props: {
  keyName: ButtonKey;
  pos: ButtonPosition;
  type: ButtonType;
  handleMerge: (key: ButtonKey) => void;
  handleAdd: (key: ButtonKey) => void;
  canvasBoxRef: React.RefObject<HTMLElement | null>;
}) => {
  const { keyName, pos, type, handleMerge, handleAdd, canvasBoxRef } = props;
  const isMerge = type === "merge";
  const Icon = isMerge ? MergeIcon : AddCircleOutlineIcon;
  const title = isMerge ? `Merge To ${keyName}` : `Add ${keyName}`;
  let placement: "top" | "bottom" | "left" | "right" = "right";

  if (keyName === "top" && isMerge) {
    placement = "top";
  } else if (keyName === "top" && !isMerge) {
    placement = "bottom";
  } else if (keyName === "bottom" && isMerge) {
    placement = "bottom";
  } else if (keyName === "bottom" && !isMerge) {
    placement = "top";
  } else if (keyName === "left" && isMerge) {
    placement = "left";
  } else if (keyName === "right" && !isMerge) {
    placement = "left";
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    isMerge ? handleMerge(keyName) : handleAdd(keyName);
  };
  return (
    <Portal target={canvasBoxRef.current} key={keyName}>
      <Tooltip
        title={title}
        placement={placement}
        sx={isMerge ? { mt: 10 } : {}}
      >
        <Box
          id={isMerge ? `mergeable-box-${keyName}` : undefined}
          sx={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            transform: pos.transform,
            width: 20,
            height: 20,
            backgroundColor: "transparent",
            zIndex: 20,
            cursor: pos.cursor,
          }}
          onClick={handleClick}
        >
          <Box sx={{ position: "relative" }}>
            <Icon
              sx={{
                position: "absolute",
                top: "0%",
                left: "0%",
                transform: "translate(12%, 12%)",
                width: 16,
                height: 16,
                borderRadius: 45,
                zIndex: isMerge ? 10 : 100,
                border: "1px solid blue",
                backgroundColor: "white",
                "&:hover": {
                  backgroundColor: "blue",
                  color: "white",
                },
              }}
            />
          </Box>
        </Box>
      </Tooltip>
    </Portal>
  );
};
