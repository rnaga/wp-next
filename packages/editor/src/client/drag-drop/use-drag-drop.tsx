import { $isElementNode, $isRootNode, Klass, LexicalNode } from "lexical";
import { logger } from "../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import {
  $getNodeAndDOMfromKey,
  $getNodeFromDOM,
  isElementNodeClass,
} from "../../lexical/lexical";
import {
  NODE_DRAG_END_COMMAND,
  NODE_DRAG_OUT_COMMAND,
  NODE_DRAG_OVER_COMMAND,
  NODE_DRAG_START_COMMAND,
} from "../node-event/commands";
import { usePreviewLayer } from "../preview-layer";
import {
  DragDropParameters,
  DragDropPosition,
  DragDropValidator,
  DropEventHandler,
} from "./types";
import { NodeEventHandlerParameters, NodeOrKlass } from "../node-event/types";
import { useBreakpoint } from "../breakpoint";
import { $isWPLexicalNode, WPLexicalNode } from "../../lexical/nodes/wp";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import {
  WP_DRAG_END_COMMAND,
  WP_DRAG_ON_SUCCESS_COMMAND,
  WP_DRAG_OUT_WITH_ERROR_COMMAND,
} from "./commands";
import { trackEventEnd } from "../event-utils";
import { CSS_EDITOR_MODE_CONFIG_HIDDEN } from "../../lexical/constants";

const __validators = new Set<
  [DragDropValidator, Klass<LexicalNode>[] | undefined]
>();

const __handlers = new Set<{
  handler: DropEventHandler;
  event: "post" | "replace";
}>();

let activeIndex = 0;
const defaultActive = () => ({
  index: activeIndex++,
  // When isScaled is true, the position is calculated based on the scaled iframe
  isScaled: true,
  dragged: {
    nodeOrKlass: undefined as NodeOrKlass | undefined | null,
    isNew: false as boolean,
    element: {
      current: undefined as HTMLElement | undefined,
      prev: undefined as HTMLElement | undefined,
    },
    dragging: false,
    initPosition: {
      clientX: 0,
      clientY: 0,
      rectOffsetX: 0,
      rectOffsetY: 0,
    },
  },
  target: {
    node: undefined as LexicalNode | undefined,
    element: {
      current: undefined as HTMLElement | undefined,
      prev: undefined as HTMLElement | undefined,
    },
    position: "top" as DragDropPosition, //"top" as "top" | "bottom",
  },
  mode: "move" as "move" | "create",
  args: undefined as NodeEventHandlerParameters | undefined,
  dropHandlers: __handlers,
});

export type ActiveDragDrop = ReturnType<typeof defaultActive>;

let active = defaultActive();

export const useDragDrop = () => {
  const [editor] = useLexicalComposerContext();
  const { iframeRef } = usePreviewLayer();
  const { breakpointRef } = useBreakpoint();
  const { wpHooks } = useWP();

  const registerDragDropValidator = (
    validator: DragDropValidator,
    klass?: Klass<LexicalNode>[]
  ) => {
    __validators.add([validator, klass]);
  };

  const registerDropEventHandler = (handler: DropEventHandler) => {
    __handlers.add({
      handler,
      event: "replace",
    });
  };

  const registerDropPostEventHandler = (handler: DropEventHandler) => {
    __handlers.add({
      handler,
      event: "post",
    });
  };

  // if isScaled is true, get the scaled position for clientX and clientY
  // otherwise, use the clientX and clientY from the event
  const getClientXYPosition = (event: MouseEvent) => {
    let clientX = event.clientX;
    let clientY = event.clientY;

    if (!active.isScaled) {
      return {
        clientX,
        clientY,
      };
    }

    // isScaled is true, get the scaled position for clientX and clientY from the iframe
    const scale = breakpointRef.current.scale;
    const iframeRect = iframeRef.current!.getBoundingClientRect();

    clientY = event.clientY;
    clientX = event.clientX;

    return {
      clientX: (clientX - iframeRect.left) / scale,
      clientY: (clientY - iframeRect.top) / scale,
    };
  };

  /**
   *
   * @param element must be an element node in iframe
   * @param event must be a drag event captured outside the iframe (parent window)
   * @returns
   */
  const getPosition = (
    element: HTMLElement,
    event: MouseEvent | DragEvent
  ): DragDropPosition => {
    const rect = element.getBoundingClientRect();

    const rectTop = rect.top;
    const rectBottom = rect.bottom;
    const rectHeight = rect.height;

    const { clientY } = getClientXYPosition(event);

    const fromTop = clientY - rectTop;
    const fromBottom = rectBottom - clientY;

    // Get the center position of the element
    const center = rectTop + (rectBottom - rectTop) / 2;
    // 25% top/bottom edge zones give a large enough hit area for before/after drops in the tree navigator.
    // The remaining middle 50% triggers center-top/center-bottom (into-element) behavior.
    const padding = rectHeight * 0.25;

    const topPadding = rectTop + padding;
    const bottomPadding = rectBottom - padding;

    if (clientY > topPadding && clientY < center) {
      return "center-top";
    } else if (clientY < bottomPadding && clientY > center) {
      return "center-bottom";
    }

    return fromTop < fromBottom ? "top" : "bottom";
  };

  const setTarget = (
    nodeKey: string | undefined,
    event: DragEvent | MouseEvent,
    args?: NodeEventHandlerParameters,
    targetElement?: HTMLElement | null
  ): [true, DragDropPosition] | [false, string] => {
    active.args = active.args ?? args;

    const activeDefaultTarget = {
      ...active,
      target: {
        ...defaultActive().target,
      },
    };

    const draggedNodeOrKlass = active.dragged.nodeOrKlass;
    const draggedKlassType = active.dragged.nodeOrKlass?.getType();

    if (!nodeKey || !draggedKlassType || !draggedNodeOrKlass) {
      // Trigger drag out event if the target is changed
      // (i.e. not the same as the previous target)
      if (active.target.node) {
        editor.dispatchCommand(NODE_DRAG_OUT_COMMAND, undefined);
      }
      active = activeDefaultTarget;
      return [false, "Invalid node key"];
    }

    return editor.read(() => {
      //const { node: immutableTargetNode, element: targetElement } =
      const nodeAndElement = $getNodeAndDOMfromKey(nodeKey, editor);

      const immutableTargetNode = nodeAndElement.node;
      targetElement = targetElement ?? nodeAndElement.element;

      let targetNode = immutableTargetNode;

      // Check if the target node and element are valid
      if (!targetNode || !targetElement) {
        editor.dispatchCommand(NODE_DRAG_OUT_COMMAND, undefined);
        active = activeDefaultTarget;

        wpHooks.action.doCommand(WP_DRAG_OUT_WITH_ERROR_COMMAND, {
          error: "Invalid target node or element",
        });

        return [false, "Invalid node or element"];
      }

      let position = getPosition(targetElement, event);

      /**
       * Returns true when the drop position should be redirected from top/bottom
       * to center-top/center-bottom — i.e. the node must land *inside* the target
       * rather than as a root-level sibling.
       *
       * Two cases require this redirect:
       * 1. The dragged node is a non-element (e.g. text node): non-elements cannot
       *    be direct children of root, so they must be dropped inside an element.
       * 2. The target is a hidden WP node: hidden-mode disallows sibling drops
       *    (no select/drag in the hidden-mode UI), so we redirect to center even
       *    when the dragged node is an element.
       */
      const shouldRedirectToCenter = (): boolean => {
        // Only redirect for top/bottom edge positions; center positions are already inside.
        if (position !== "top" && position !== "bottom") {
          return false;
        }

        // Only redirect when the target is a direct child of root.
        if (!targetNode || !$isRootNode(targetNode.getParent())) {
          return false;
        }

        if (active.dragged.isNew) {
          // New node: check the class, not an instance.
          if (!isElementNodeClass(draggedNodeOrKlass as Klass<LexicalNode>)) {
            return true;
          }

          return false;
        }

        // dragged node is LexcialNode instance (!active.dragged.isNew)
        // Existing node: non-element nodes must go inside an element.
        if (!$isElementNode(draggedNodeOrKlass as LexicalNode)) {
          return true;
        }

        return false;
      };

      if (shouldRedirectToCenter()) {
        position = position === "top" ? "center-top" : "center-bottom";
      }

      // Reject drops that would land *inside* a hidden WP element node.
      // shouldRedirectToCenter() above may have already converted a top/bottom
      // position to center for hidden targets; this guard catches that case and
      // any direct center-drop attempt, since hidden nodes cannot accept children
      // via drag and drop.
      if (
        $isWPLexicalNode(targetNode) &&
        $isElementNode(targetNode) &&
        true ===
          targetNode.getCSSEditorModeConfig(CSS_EDITOR_MODE_CONFIG_HIDDEN) &&
        (position == "center-bottom" || position == "center-top")
      ) {
        return [false, "Cannot drop inside a non-hidden WP node"];
      }

      // Check if the target node is not the child of the dragged node
      if (!active.dragged.isNew) {
        const draggedNode = draggedNodeOrKlass as LexicalNode;
        if (
          targetNode
            .getParents()
            .find((parent) => parent.getKey() === draggedNode.getKey())
        ) {
          editor.dispatchCommand(NODE_DRAG_OUT_COMMAND, undefined);
          active = activeDefaultTarget;

          wpHooks.action.doCommand(WP_DRAG_OUT_WITH_ERROR_COMMAND, {
            error: "Target node is child of dragged node",
          });

          return [false, "target is child of dragged node"];
        }
      }

      // Validate the dragged node and the target node with the registered validators
      for (const [validator, klasses] of __validators) {
        const shouldValidate =
          !klasses ||
          klasses.filter((klass) => {
            return klass.getType() === targetNode!.getType();
          }).length > 0;

        if (shouldValidate) {
          const [isValid, validatedTargetNodeOrErrorMessage] = validator({
            isNew: active.dragged.isNew,
            dragged: draggedNodeOrKlass,
            targetNode,
            position,
            editor,
          } as DragDropParameters);

          if (!isValid) {
            editor.dispatchCommand(NODE_DRAG_OUT_COMMAND, undefined);
            active = activeDefaultTarget;

            wpHooks.action.doCommand(WP_DRAG_OUT_WITH_ERROR_COMMAND, {
              error: validatedTargetNodeOrErrorMessage,
            });

            return [false, validatedTargetNodeOrErrorMessage];
          }

          // Update the target node if the validator returns a new node
          targetNode = validatedTargetNodeOrErrorMessage;
        }
      }

      const targetNodeKey = targetNode?.getKey();

      // Check if the target node is set
      if (!targetNodeKey) {
        editor.dispatchCommand(NODE_DRAG_OUT_COMMAND, undefined);
        active = activeDefaultTarget;

        wpHooks.action.doCommand(WP_DRAG_OUT_WITH_ERROR_COMMAND, {
          error: "Invalid target node key",
        });
        return [false, "Invalid node key"];
      }

      // Check if the dragged node is the same as the target node
      const isSame =
        !active.dragged.isNew &&
        nodeKey &&
        nodeKey === (draggedNodeOrKlass as LexicalNode)?.getKey();

      if (isSame) {
        wpHooks.action.doCommand(WP_DRAG_OUT_WITH_ERROR_COMMAND, {
          error: "Cannot drop on the same node",
        });

        return [
          false,
          `Same node ${(
            draggedNodeOrKlass as LexicalNode
          )?.getKey()} [${nodeKey}]`,
        ];
      }

      // Check if the target node is changed
      const isTargetChanged =
        targetNode?.getKey() !== active.target.node?.getKey();

      if (
        active.args &&
        (isTargetChanged || active.target.position !== position)
      ) {
        editor.dispatchCommand(NODE_DRAG_OVER_COMMAND, {
          ...active.args,
          targetNode,
          targetElement,
          position,
        });
      }

      trackEventEnd(
        "drag-drop-valid-target",
        () => {
          wpHooks.action.doCommand(WP_DRAG_ON_SUCCESS_COMMAND, undefined);
        },
        100,
        {
          counter: 3,
        }
      );

      active = {
        ...active,
        target: {
          ...active.target,
          node: targetNode,
          element: {
            current: targetElement ?? undefined,
            prev: active.target.element.current,
          },
          position,
        },
      };

      return [true, position];
    }) as [true, DragDropPosition] | [false, string];
  };

  const setNewDragged = (klass: NodeOrKlass) => {
    active = {
      ...active,
      // New dragged node (icon) is always scaled
      // since it's dropped in the iframe (scaled)
      isScaled: true,
      dragged: {
        ...active.dragged,
        isNew: true,
        dragging: true,
        nodeOrKlass: klass,
      },
    };
  };

  const setDragged = (
    nodeKey: string,
    event: MouseEvent,
    args?: NodeEventHandlerParameters & {
      isScaled?: boolean;
    }
  ) => {
    const { isScaled = true } = args ?? {};
    editor.read(() => {
      const { node, element } = $getNodeAndDOMfromKey(nodeKey, editor);
      const rect = element?.getBoundingClientRect();
      const isValid = !!element && !!$getNodeFromDOM(element, editor);

      const { clientX, clientY } = getClientXYPosition(event);

      active = {
        ...active,
        isScaled,
        dragged: {
          ...active.dragged,
          isNew: false,
          nodeOrKlass: node,
          element: {
            current: isValid ? element : undefined,
            prev: active.dragged.element.current,
          },
          initPosition: {
            clientX,
            clientY,
            rectOffsetX: rect?.left ?? 0,
            rectOffsetY: rect?.top ?? 0,
          },
        },
        args,
      };
    });
  };

  // Check elements and nodes under the cursor, and set the target node
  const checkElementsUnderCursorAndSetTarget = (args: {
    element?: HTMLElement;
    contentDocument?: Document | null;
    event: MouseEvent;
  }):
    | [false, boolean]
    | [true, HTMLElement, DragDropPosition, WPLexicalNode] => {
    const {
      element,
      event,
      contentDocument = iframeRef.current?.contentDocument,
    } = args;

    const { clientX, clientY } = getClientXYPosition(event);

    // Get the elements under the cursor
    const elementsUnderCursor = contentDocument?.elementsFromPoint(
      clientX,
      clientY
    ) as HTMLElement[];

    let isOverItself = false;

    for (const elementUnderCursor of elementsUnderCursor) {
      if (!!element && elementUnderCursor === element) {
        logger.log("Element is being dragged over itself");
        isOverItself = true;
        continue;
      }

      const targetNode = editor.read(() =>
        $getNodeFromDOM(elementUnderCursor, editor)
      );

      if (!targetNode) {
        continue;
      }

      const [isTrue, errorOrPosition] = setTarget(
        targetNode.getKey(),
        event,
        undefined,
        elementUnderCursor
      );

      if (!isTrue) {
        continue;
      }

      return [
        true,
        elementUnderCursor,
        errorOrPosition,
        targetNode as WPLexicalNode,
      ];
    }

    // If target is set, reset target node
    if (active.target.node) {
      editor.dispatchCommand(NODE_DRAG_OUT_COMMAND, undefined);
      active = {
        ...active,
        target: {
          ...defaultActive().target,
        },
      };
    }
    return [false, isOverItself];
  };

  const startDragging = (args: NodeEventHandlerParameters) => {
    if (active.dragged.dragging === false) {
      editor.dispatchCommand(NODE_DRAG_START_COMMAND, {
        ...args,
      });
      active.dragged.dragging = true;
    }
  };

  const move = (
    event: MouseEvent,
    args?: {
      contentDocument?: Document | null;
      //position?: { x: number; y: number };
    }
  ) => {
    const { contentDocument = iframeRef.current?.contentDocument } = args ?? {};
    const activeDragged = active.dragged;
    const element = activeDragged.element.current;

    // Validate the current dragged node and position before updating the position
    if (
      !element ||
      !activeDragged.element.current ||
      !activeDragged.initPosition
    ) {
      if (activeDragged.dragging) {
        checkElementsUnderCursorAndSetTarget({
          event,
          contentDocument,
        });
      }
      return;
    }

    if (active.args && active.dragged.dragging === false) {
      startDragging(active.args);
    }

    const { clientX, clientY } = getClientXYPosition(event);

    const newPositionX =
      clientX -
      activeDragged.initPosition.rectOffsetX -
      (activeDragged.initPosition.clientX -
        activeDragged.initPosition.rectOffsetX);

    const newPositionY =
      clientY -
      activeDragged.initPosition.rectOffsetY -
      (activeDragged.initPosition.clientY -
        activeDragged.initPosition.rectOffsetY);

    element.style.border = "1px solid grey";
    element.style.willChange = "transform";
    element.style.transform = `translate(${newPositionX}px, ${newPositionY}px)`;

    checkElementsUnderCursorAndSetTarget({ element, event });
  };

  const end = (args?: NodeEventHandlerParameters) => {
    active.args = args ?? active.args;
    const activeDragged = active.dragged;
    const element = activeDragged.element.current;

    if (active.dragged.dragging === true) {
      editor.dispatchCommand(NODE_DRAG_END_COMMAND, undefined);
    }

    wpHooks.action.doCommand(WP_DRAG_END_COMMAND, undefined);
    active = defaultActive();

    if (
      !element ||
      !activeDragged.element.current ||
      !activeDragged.initPosition
    ) {
      return;
    }

    setTimeout(() => {
      element.style.removeProperty("border");
      element.style.removeProperty("will-change");
      element.style.removeProperty("transform");
    });
  };

  const isDragging = () => active.dragged.dragging;

  const get = () => active;

  /**
   * Overrides the stored drop position without recalculating from the event.
   * Used by the tree navigator to remap center-top/center-bottom → top/bottom
   * for cross-parent drops on element nodes whose parent is also an element,
   * so the drop handler inserts between siblings rather than appending inside.
   * Not intended for use in the canvas/PreviewLayer.
   */
  const overridePosition = (position: DragDropPosition) => {
    active = { ...active, target: { ...active.target, position } };
  };

  return {
    registerDragDropValidator,
    registerDropEventHandler,
    registerDropPostEventHandler,
    isDragging,
    setTarget,
    setDragged,
    setNewDragged,
    startDragging,
    move,
    end,
    get,
    getPosition,
    overridePosition,
    checkElementsUnderCursorAndSetTarget,
  };
};
