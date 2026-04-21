import {
  $getNodeByKey,
  $getRoot,
  $isElementNode,
  $setSelection,
  createEditor,
  EditorState,
  LexicalEditor,
  LexicalNode,
} from "lexical";
import {
  $createFromStack,
  $nodeToStack,
  $refreshNode,
  $removeNode,
} from "../../lexical/lexical";
import { WPLexicalNode } from "../../lexical/nodes/wp";
import {
  GlobalEventHandler,
  GlobalEventHandlerParameters,
} from "../global-event/types";

const $getSelectedNode = (args: GlobalEventHandlerParameters) => {
  const {
    editor,
    globalEvent: { selectedNodeRef },
  } = args;
  return selectedNodeRef.current?.node
    ? $getNodeByKey(selectedNodeRef.current.node!.getLatest().getKey())
    : undefined;
};

export const $deleteNodeMenuHandler: GlobalEventHandler = (
  args: GlobalEventHandlerParameters
) => {
  const selectedNode = $getSelectedNode(args);

  if (!selectedNode) {
    return;
  }

  // Clear the NodeSelection BEFORE removing the node to prevent Lexical's
  // internal node.remove() from calling selectPrevious(), which triggers
  // a DOM selectionchange event and an untagged follow-up editor update
  // that creates an extra history entry.
  $setSelection(null);
  $removeNode(selectedNode);
};

let copied: {
  node?: LexicalNode | null;
  serialized?: any;
  editorState: EditorState | null;
  isCut: boolean;
} = {
  node: null,
  serialized: null,
  editorState: null,
  isCut: false,
};
export const $getCopiedNode = () => copied.node;

export const $copyNodeMenuHandler: GlobalEventHandler = (
  args: GlobalEventHandlerParameters
) => {
  const selectedNode = $getSelectedNode(args);

  if (!selectedNode) {
    return;
  }

  const { editor } = args;

  copied = {
    node: selectedNode,
    serialized: selectedNode.exportJSON(),
    editorState: editor.getEditorState(),
    isCut: false,
  };
};

export const $cutNodeMenuHandler: GlobalEventHandler = (
  args: GlobalEventHandlerParameters
) => {
  const { editor } = args;

  const selectedNode = $getSelectedNode(args);

  if (!selectedNode) {
    return;
  }

  copied = {
    node: selectedNode,
    serialized: selectedNode.exportJSON(),
    editorState: editor.getEditorState(),
    isCut: true,
  };
  // Clear selection before removal (same reason as $deleteNodeMenuHandler)
  $setSelection(null);
  $removeNode(selectedNode);
};

export const $pasteNodeMenuHandler: GlobalEventHandler = (
  args: GlobalEventHandlerParameters
) => {
  const { editor } = args;
  const targetNode = $getSelectedNode(args) ?? $getRoot();

  // Return early if there is no copied node or if the copied node is the same as the target node
  if (!copied.node) {
    return;
  }

  // Make sure copied node hasn't been removed
  const { node: copiedNode, serialized, editorState, isCut } = copied;

  // 1. Create editor (temporary) to reconstruct the node
  // 2. Create stack from copied node in the temporary editor
  // 3. Create node from the stack
  //
  // This can prevent error that occurs when pasting a node that has been removed in the active editor (current editor)
  const tmpEditor = createEditor({
    editorState: editorState!,
  });

  const stack = tmpEditor.read(() => {
    const nodeToCopy = $getNodeByKey(copiedNode.getKey()) as WPLexicalNode;
    return $nodeToStack(nodeToCopy);
  });

  const newNode = $createFromStack(stack);

  // Reset CSS className so that it doesn't conflict with CSS of the original node.
  //
  // Note: CSS classNames of child nodes are reset by $createFromStack so we don't need to reset them here.
  newNode.__css.resetClassName();

  // If target node is not found, then paste at the end of the root node
  if (!targetNode) {
    const childNodes = $getRoot().getChildren().filter($isElementNode);
    childNodes.length > 0
      ? childNodes[childNodes.length - 1]?.insertAfter(newNode)
      : // If there is no child node, then append the new node to the root node
        $getRoot().append(newNode);
  } else if ($isElementNode(targetNode)) {
    targetNode.append(newNode);
  } else {
    targetNode.insertAfter(newNode);
  }

  // refresh node
  $refreshNode(newNode);

  copied = { node: null, serialized: null, editorState: null, isCut: false };
};
