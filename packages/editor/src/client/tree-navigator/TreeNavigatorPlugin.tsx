"use client";
import {
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_HIGH,
  ElementNode,
  HISTORY_MERGE_TAG,
} from "lexical";
import React, {
  createContext,
  JSX,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, IconButton, Tooltip } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  SimpleTreeView,
  TreeItem,
  TreeViewDefaultItemModelProperties,
  useSimpleTreeViewApiRef,
} from "@mui/x-tree-view";

import {
  $getNodeFromDOM,
  $isNodeEditableContextMenu,
  $isNodeEditableMouseTool,
} from "../../lexical";
import { $isWPElementNode } from "../../lexical/nodes/wp/WPElementNode";
import { $getBodyNode, $isBodyNode } from "../../lexical/nodes/body/BodyNode";
import { DroppableArea, useDragDrop } from "../drag-drop";
import { useMouseMove } from "@rnaga/wp-next-ui/hooks/use-mouse-move";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useGlobalEvent, useSelectedNode } from "../global-event";
import {
  clickEventHandler,
  contextMenuEventHandler,
  NODE_CREATED_COMMAND,
  NODE_DESTROYED_COMMAND,
  NODE_PROPERTY_UPDATED,
  NODE_UPDATED_COMMAND,
  useNodeEvent,
} from "../node-event";

import {
  contextMenuEventHandler as globalContextMenuEventHandler,
  mouseMoveEventHandler as globalMouseMoveEventHandler,
} from "../global-event/global-event-handlers";

import { $isWPLexicalNode, WPLexicalNode } from "../../lexical/nodes/wp";
import { CSS_EDITOR_MODE_CONFIG_HIDDEN } from "../../lexical/constants";
import { setEditorModeConfig } from "../../lexical/editor-mode-config";
import { logger } from "@rnaga/wp-next-core/client/utils/logger";

type ApiRef = Parameters<typeof SimpleTreeView>["0"]["apiRef"];

const TreeViewContext = createContext<{
  apiRef: ApiRef;
}>({} as any);

const flatTreeItems = (apiRef: ApiRef) => {
  const innerFn = (items: TreeViewDefaultItemModelProperties[]) => {
    const result: TreeViewDefaultItemModelProperties[] = [];
    for (const item of items) {
      result.push(item);
      if (item.children) {
        result.push(...innerFn(item.children));
      }
    }

    return result;
  };

  return innerFn(apiRef?.current?.getItemTree?.() ?? []);
};

const getTreeItemElements = (apiRef: ApiRef) => {
  const items = flatTreeItems(apiRef);

  const elements: HTMLElement[] = [];

  for (const item of items) {
    const element = apiRef?.current?.getItemDOMElement?.(item.id);
    if (element) {
      elements.push(element);
    }
  }

  return elements;
};

const NodeTreeItem = (props: {
  node: WPLexicalNode;
  children?: React.ReactNode;
  parentElementRef: React.RefObject<HTMLUListElement | null>;
}) => {
  const { node, parentElementRef } = props;
  const { apiRef } = useContext(TreeViewContext);
  const [editor] = useLexicalComposerContext();
  const dragDrop = useDragDrop();

  const { selectedNodeRef, setSelectedNode } = useSelectedNode();
  const { getParameters } = useNodeEvent();

  const ref = useRef<HTMLLIElement | null>(null);
  const refY = useRef<number>(0);
  const refExpanded = useRef<boolean>(false);

  const [isHovered, setIsHovered] = useState(false);
  const [isHidden, setIsHidden] = useState(() =>
    editor.read(() => {
      const latest = node.getLatest();
      if (!$isWPLexicalNode(latest)) {
        return false;
      }
      return !!latest.__css?.getEditorModeConfig(CSS_EDITOR_MODE_CONFIG_HIDDEN);
    })
  );

  const handleHideToggle = (e: React.MouseEvent) => {
    // Prevent triggering drag or node selection
    e.stopPropagation();

    const nextHidden = !isHidden;
    setIsHidden(nextHidden);

    // Update editor mode config for the node, cache it in the editor, then trigger and brodcast the event via editor command.
    setEditorModeConfig(editor, node, "css", {
      [CSS_EDITOR_MODE_CONFIG_HIDDEN]: nextHidden,
    });

    // unselect node when hiding, select node when showing
    if (
      nextHidden &&
      selectedNodeRef.current.node?.getKey() === node.getKey()
    ) {
      setSelectedNode(undefined);
    }
  };

  const resetBorders = () => {
    for (const element of getTreeItemElements(apiRef)) {
      element.style.removeProperty("border-top");
      element.style.removeProperty("border-bottom");
      element.style.removeProperty("border");
    }
  };

  const handleDeltaChange = (
    e: MouseEvent,
    delta: { x: number; y: number }
  ) => {
    // Hidden nodes are not draggable
    if (isHidden) {
      return;
    }

    // If the node is expanded, collapse it
    if (refExpanded.current == true) {
      refExpanded.current = false;
      apiRef?.current?.setItemExpansion?.({ itemId: node.getKey(), shouldBeExpanded: false });
    }

    // Notify the dragDrop that the dragging has started
    dragDrop.startDragging(
      getParameters({
        nodeKey: node.getKey(),
        event: e,
        element: ref.current!,
      })
    );

    // if selected node is not the current node, set it as the selected node
    if (selectedNodeRef.current.node?.getKey() !== node.getKey()) {
      setSelectedNode(node);
    }

    const element = ref.current;
    if (!element) {
      return;
    }

    refY.current += delta.y;

    element.style.willChange = "transform";
    element.style.position = "absolute";
    element.style.top = "0";
    element.style.left = "0";
    element.style.transform = `translateY(${refY.current}px)`;

    // Unset border from all elements
    resetBorders();

    const [isTrue, targetElement, position] =
      dragDrop.checkElementsUnderCursorAndSetTarget({
        element,
        contentDocument: window.document,
        event: e,
      });

    // isTrue is false, meaning the dragged node is out of tree view
    // Set targetElement to the root node so that the dragged node is appended to the root node as the last child
    if (!isTrue) {
      const rootNode = editor.read(() => $getRoot());
      dragDrop.setTarget(rootNode.getKey(), e);
      return;
    }

    // isTrue is true, meaning the dragged node is inside the tree view and has targetElement / targetNode

    // Get the dragged node and the target node to determine the border style
    const draggedNode = editor.read(() => $getNodeFromDOM(element, editor));
    const targetNode = editor.read(() =>
      $getNodeFromDOM(targetElement, editor)
    );

    const borderStyle = "2px solid red";

    const parentTargetNode = editor.read(() => targetNode?.getParent());
    const parentDraggedNode = editor.read(() => draggedNode?.getParent());

    /**
     * True when the dragged node and the target node share the same parent element.
     * In this case the drop semantics are inverted compared to the cross-parent case:
     * top/bottom edge → drop INTO the target element; center → insert between siblings.
     */
    const isSiblingDrop =
      $isElementNode(targetNode) &&
      !!parentTargetNode &&
      !!parentDraggedNode &&
      parentTargetNode.__key === parentDraggedNode.__key;

    /**
     * For cross-parent drops on element nodes whose parent is also an element,
     * the visual shows a line border (insert before/after), but the drop handler
     * would normally append inside. Override the stored position so both agree.
     * The tree navigator needs this remapping; the canvas/PreviewLayer does not.
     */
    if (
      !isSiblingDrop &&
      $isElementNode(targetNode) &&
      $isElementNode(parentTargetNode)
    ) {
      if (position === "center-top") {
        dragDrop.overridePosition("top");
      } else if (position === "center-bottom") {
        dragDrop.overridePosition("bottom");
      }
    }

    if (isSiblingDrop) {
      if (position === "center-top" || position === "center-bottom") {
        targetElement.style.border = borderStyle;
      } else if (position === "top") {
        targetElement.style.borderTop = borderStyle;
      } else {
        targetElement.style.borderBottom = borderStyle;
      }
    } else if (
      $isElementNode(targetNode) &&
      !$isElementNode(parentTargetNode) &&
      (!$isWPElementNode(draggedNode) ||
        ($isElementNode(draggedNode) && position == "center-top") ||
        position == "center-bottom")
    ) {
      targetElement.style.border = borderStyle;
    } else if (position == "top" || position == "center-top") {
      targetElement.style.borderTop = borderStyle;
    } else {
      targetElement.style.borderBottom = borderStyle;
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    // Hidden nodes are not selectable
    if (isHidden) {
      return;
    }

    // toggle the expansion using the api and refExpaned
    refExpanded.current = !refExpanded.current;
    apiRef?.current?.setItemExpansion?.({ itemId: node.getKey(), shouldBeExpanded: refExpanded.current });

    const nodeKey = node.getKey();
    const nodeDOM = editor.read(() => editor.getElementByKey(nodeKey));

    if (!nodeDOM) {
      return;
    }

    const args = getParameters({
      nodeKey: node.getKey(),
      event: e,
      element: nodeDOM,
    });

    // Trigger click event to select the node
    clickEventHandler(args);

    dragDrop.setDragged(nodeKey, e, { ...args, isScaled: false });

    // Set the initial value of refY
    const parentRect = parentElementRef.current?.getBoundingClientRect()!;
    const rect = ref.current?.getBoundingClientRect()!;

    refY.current = rect.top - parentRect.top;
  };

  const handleMouseUp = (e: MouseEvent) => {
    refY.current = 0;
    dragDrop.end();

    const element = ref.current;
    if (!element) {
      return;
    }

    element.style.removeProperty("will-change");
    element.style.removeProperty("position");
    element.style.removeProperty("transform");
    element.style.removeProperty("top");
    element.style.removeProperty("left");

    // Trigger editor command to notify that the node has been dropped
    editor.dispatchCommand(NODE_PROPERTY_UPDATED, {
      type: "input",
      node,
    });

    resetBorders();
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    const args = getParameters({
      nodeKey: node.getKey(),
      event: e as unknown as Event,
      element: ref.current!,
    });
    contextMenuEventHandler(args);
  };

  const { initMouseMove } = useMouseMove({
    onDeltaChange: handleDeltaChange,
    onMouseUp: handleMouseUp,
    onMouseDown: handleMouseDown,
    onContextMenu: handleContextMenu,
    cursor: isHidden ? "default" : "grabbing",
    threshold: 1,
  });

  const isSelected = selectedNodeRef.current.node?.getKey() === node.getKey();

  const lexicalKeyAttribute = useMemo(() => {
    return { [`__lexicalkey_${editor._key}`]: node.getKey() };
  }, [editor]);

  return (
    <TreeItem
      ref={ref}
      onMouseDown={initMouseMove(ref)}
      key={`${node.getKey()}`}
      itemId={`${node.getKey()}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      sx={
        isHidden
          ? {
              cursor: "default !important",
              "& .MuiTreeItem-iconContainer": { cursor: "default !important" },
              "& .MuiTreeItem-content": { cursor: "default !important" },
            }
          : undefined
      }
      label={
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography
            size="medium"
            sx={{
              // Dim the label when the node is hidden so it's obvious in the tree
              color: isHidden ? "text.disabled" : "black",
              fontWeight: isSelected ? 600 : 400,
              userSelect: "none",
            }}
          >
            {node.getType()} {node.getKey()}
          </Typography>
          {/* Show the toggle button on hover, or always when the node is hidden */}
          {(isHovered || isHidden) && (
            <Tooltip
              title={isHidden ? "Show in preview" : "Hide in preview"}
              placement="top"
            >
              <IconButton
                size="small"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={handleHideToggle}
                sx={{ p: 0.25 }}
              >
                {isHidden ? (
                  <VisibilityOffIcon sx={{ fontSize: 14 }} />
                ) : (
                  <VisibilityIcon sx={{ fontSize: 14 }} />
                )}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      }
      {...lexicalKeyAttribute}
    >
      {/* When hidden, suppress children — they are invisible too */}
      {!isHidden && props.children && <Box>{props.children}</Box>}
    </TreeItem>
  );
};

export const TreeNavigatorPlugin = () => {
  const [editor] = useLexicalComposerContext();
  const [items, setItems] = useState<JSX.Element[]>([]);
  const [bodyNodeKey, setBodyNodeKey] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const apiRef = useSimpleTreeViewApiRef();
  const parentElementRef = useRef<HTMLUListElement | null>(null);

  const {
    globalEvent: { updateFocusOnSelectedNode },
    getParameters,
  } = useGlobalEvent();
  const nodeEvent = useNodeEvent();
  const { setSelectedNode, selectedNode } = useSelectedNode();

  const buildItems = () => {
    editor.read(() => {
      const bodyNode = $getRoot().getChildren().find($isBodyNode);
      if (!bodyNode) return;
      const key = bodyNode.getKey();
      setBodyNodeKey(key);
      setExpandedItems((prev) => (prev.includes(key) ? prev : [...prev, key]));
      setItems(itemsFn(bodyNode as ElementNode));
    });
  };

  const itemsFn = (node: ElementNode) => {
    return node
      .getChildren()
      .filter((node) => {
        // Filter out the nodes that are not draggable
        return $isWPLexicalNode(node) && node.__draggable === true;
      })
      .map((node) => {
        if (
          editor.read(() => !$isNodeEditableMouseTool(node as WPLexicalNode))
        ) {
          // If the node is not editable - the node is not movable
          // So we need to return a TreeItem instead of NodeTreeItem
          return (
            <TreeItem
              key={`${node.getKey()}`}
              itemId={`${node.getKey()}`}
              label={
                <Typography
                  size="medium"
                  sx={{
                    color: "black",
                    fontWeight: 400,
                    userSelect: "none",
                  }}
                >
                  {node.getType()} {node.getKey()}
                </Typography>
              }
            >
              {$isElementNode(node) && node.getChildren().length > 0 && (
                <Box>{itemsFn(node)}</Box>
              )}
            </TreeItem>
          );
        }

        return (
          <NodeTreeItem
            key={`${node.getKey()}`}
            node={node as WPLexicalNode}
            parentElementRef={parentElementRef}
          >
            {$isElementNode(node) && node.getChildren().length > 0 && (
              <Box>{itemsFn(node)}</Box>
            )}
          </NodeTreeItem>
        );
      });
  };

  useEffect(() => {
    buildItems();
  }, []);

  useEffect(() => {
    const removeCommands: ReturnType<typeof editor.registerCommand>[] = [];
    for (const command of [
      NODE_UPDATED_COMMAND,
      NODE_CREATED_COMMAND,
      NODE_DESTROYED_COMMAND,
    ]) {
      removeCommands.push(
        editor.registerCommand(
          command,
          (args) => {
            buildItems();
            return false;
          },
          COMMAND_PRIORITY_HIGH
        )
      );
    }

    return () => {
      for (const removeCommand of removeCommands) {
        removeCommand();
      }
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    const args = getParameters(e as unknown as Event, nodeEvent);
    // Unset selected node before triggering the context menu
    setSelectedNode(undefined);

    // Trigger context menu event
    globalContextMenuEventHandler(args);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Unset selected node when clicking outside the tree view
    setSelectedNode(undefined);

    // Set focus so that keyboard events are triggered
    updateFocusOnSelectedNode(true);
  };

  return (
    <TreeViewContext value={{ apiRef }}>
      <DroppableArea>
        {" "}
        <Box
          sx={{
            display: "flex",
            position: "relative",
            flexDirection: "column",
            gap: 2,
            mt: 2,
          }}
          onContextMenu={handleContextMenu}
          onClick={handleClick}
        >
          <SimpleTreeView
            ref={parentElementRef}
            apiRef={apiRef}
            sx={{
              overflowY: "auto",
              height: "100vh",
              "& .MuiTreeItem-content.Mui-focused:not(.Mui-selected)": {
                backgroundColor: "transparent",
              },
            }}
            expandedItems={expandedItems}
            onExpandedItemsChange={(_, newExpanded) => {
              // Keep the body node always expanded
              if (bodyNodeKey && !newExpanded.includes(bodyNodeKey)) {
                setExpandedItems([bodyNodeKey, ...newExpanded]);
              } else {
                setExpandedItems(newExpanded);
              }
            }}
            selectedItems={selectedNode?.getKey() ?? null}
            onSelectedItemsChange={() => {}}
          >
            {bodyNodeKey && (
              <TreeItem
                key={bodyNodeKey}
                itemId={bodyNodeKey}
                onMouseDown={(e) => {
                  //e.stopPropagation();
                  const bodyNode = editor.read(() => $getBodyNode());
                  setSelectedNode(bodyNode as WPLexicalNode);
                }}
                onClick={(e) => e.stopPropagation()}
                label={
                  <Typography
                    size="medium"
                    sx={{
                      color: "black",
                      fontWeight:
                        selectedNode?.getKey() === bodyNodeKey ? 600 : 400,
                      userSelect: "none",
                    }}
                  >
                    body {bodyNodeKey}
                  </Typography>
                }
              >
                <Box>{items}</Box>
              </TreeItem>
            )}
          </SimpleTreeView>
        </Box>
      </DroppableArea>
    </TreeViewContext>
  );
};
