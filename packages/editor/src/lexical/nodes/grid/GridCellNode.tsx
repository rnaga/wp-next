import {
  DecoratorNode,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  Spread,
} from "lexical";

import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";
import { $convertGridNodeToMatrix, $isGridNode } from "./GridNode";
import {
  CSS_DEFAULT_DEVICE,
  DEFAULT_STYLES,
} from "../../styles-core/constants";
import type * as types from "../../../types";
import { setAndGetStyle } from "../../styles-core/set-and-get-style";

/**
 * Represents a CSS record for a grid cell, defining its span properties.
 *
 * @template T - The type of the CSS record.
 * @property $__spanColumn - Specifies the number of columns the grid cell spans.
 * @property $__spanRow - Specifies the number of rows the grid cell spans.
 */
type GridCellCSSRecord = types.CSSRecord<{
  $__spanColumn: number;
  $__spanRow: number;
}>;

export type SerializedGridNode = Spread<
  {
    // __spans: GridCellCSSRecord;
  },
  SerializedWPElementNode
>;

export class GridCellNode extends WPElementNode {
  // GridCellNode can only be removed by removing the parent (e.g. GridNode)
  __removable: boolean = false;

  __editableContextMenu: boolean = false;

  // __spans = {
  //   ...DEFAULT_STYLES,
  //   desktop: {
  //     $__spanColumn: 1,
  //     $__spanRow: 1,
  //   },
  // } as GridCellCSSRecord;

  getSpans() {
    //const _spans = compileCSSRecord(this.__spans);

    const spans = this.__css.get().__spans as {
      $__spanColumn?: number;
      $__spanRow?: number;
    };

    return {
      spanColumn: spans?.$__spanColumn || 1,
      spanRow: spans?.$__spanRow || 1,
    };
  }

  updateSpans(
    span: {
      spanColumn: number;
      spanRow: number;
    },
    setToDefaultDevice: boolean = false
  ) {
    const { spanColumn, spanRow } = span;

    return setAndGetStyle(
      this.__css,
      {
        __spans: { $__spanColumn: spanColumn, $__spanRow: spanRow },
      },
      "__spans"
    );

    // this.__spans = processCSS(
    //   this.__spans,
    //   {
    //     $__spanColumn: spanColumn,
    //     $__spanRow: spanRow,
    //   },
    //   {
    //     device: setToDefaultDevice ? CSS_DEFAULT_DEVICE : CSSDevice.__current,
    //   }
    // );
  }

  get __spanColumn() {
    //const spans = compileCSSRecord(this.__spans);

    const spans = this.__css.get().__spans as {
      $__spanColumn?: number;
      $__spanRow?: number;
    };
    return spans?.$__spanColumn || 1;
  }

  set __spanColumn(value: number) {
    // this.__spans = processCSS(this.__spans, {
    //   $__spanColumn: value,
    // });

    this.__css.set({
      __spans: { $__spanColumn: value },
    });
  }

  get __spanRow() {
    //const spans = compileCSSRecord(this.__spans);
    const spans = this.__css.get().__spans as {
      $__spanColumn?: number;
      $__spanRow?: number;
    };

    return spans?.$__spanRow || 1;
  }

  set __spanRow(value: number) {
    this.__css.set({
      __spans: { $__spanRow: value },
    });

    // this.__spans = processCSS(this.__spans, {
    //   $__spanRow: value,
    // });
  }

  static getType(): string {
    return "grid-cell";
  }

  afterClone(prevNode: GridCellNode): void {
    super.afterClone(prevNode);

    //this.__spans = prevNode.__spans;
  }

  static clone(node: GridCellNode): GridCellNode {
    const newNode = new GridCellNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  static importJSON(serializedNode: SerializedGridNode): GridCellNode {
    const node = new GridCellNode();
    node.importJSON(serializedNode);

    //node.__spans = serializedNode.__spans;

    return node;
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");

    this.__css.setDefault({
      paddingTop: "20px",
      paddingBottom: "20px",
      paddingLeft: "20px",
      paddingRight: "20px",
    });

    return element;
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    return element;
  }

  exportJSON(): SerializedGridNode {
    return {
      ...super.exportJSON(),
      // __spans: this.__spans,

      type: "grid-cell",
    };
  }

  getCSS() {
    //const spans = compileCSSRecord(this.__spans);
    const spans = this.__css.get().__spans as {
      $__spanColumn?: number;
      $__spanRow?: number;
    };
    const spanColumn = spans?.$__spanColumn || 1;
    const spanRow = spans?.$__spanRow || 1;

    const css = this.__css.get();

    return {
      ...css,
      __layout: {
        ...css?.__layout,
        gridColumn: `span ${spanColumn}`,
        gridRow: `span ${spanRow}`,
      },
    };
  }

  updateCSS(setToDefaultDevice = false) {
    this.__css.set(
      this.getCSS(),
      setToDefaultDevice ? CSS_DEFAULT_DEVICE : undefined
    );
  }
}

export const $createGridCellNode = (node?: GridCellNode): GridCellNode => {
  const gridCell = new GridCellNode();
  $afterWPElementNodeCreation(gridCell, node);
  if (node) {
    //gridCell.__spans = node.__spans;
  }

  // Set initial CSS to default device
  gridCell.updateCSS(true);
  return gridCell;
};

export const $isGridCellNode = (
  node: LexicalNode | null | undefined
): node is GridCellNode => {
  return node instanceof GridCellNode;
};

export const $updateSpans = (
  editor: LexicalEditor,
  gridCellNode: GridCellNode,
  span: {
    spanColumn: number;
    spanRow: number;
  },
  setToDefaultDevice: boolean = false
) => {
  const { spanColumn, spanRow } = span;

  // const currentDevice = setToDefaultDevice
  //   ? CSS_DEFAULT_DEVICE
  //   : CSSDevice.__current;

  gridCellNode.__css.set({
    __spans: { $__spanColumn: spanColumn, $__spanRow: spanRow },
  });

  // gridCellNode.__spans = processCSS(
  //   gridCellNode.__spans,
  //   {
  //     $__spanColumn: spanColumn,
  //     $__spanRow: spanRow,
  //   },
  //   {
  //     device: currentDevice,
  //   }
  // );

  // Adjust the grid's row count if changing the cell's span affects the overall grid structure.

  const gridNode = gridCellNode.getParent();
  if (!$isGridNode(gridNode)) {
    throw new Error("GridCellNode must be a child of GridNode");
  }

  // Calculate frRowLength with cellsMatris
  const cellsMatrix = $convertGridNodeToMatrix(gridNode);

  const currentfrRowLength = gridNode.getFrs().frRow.length;
  let frRowLength = 1;

  for (let i = 0; i < cellsMatrix.length; i++) {
    for (let j = 0; j < cellsMatrix[i].length; j++) {
      const cell = cellsMatrix[i]?.[j] as GridCellNode | null;
      if ($isGridCellNode(cell) && i + 1 > frRowLength) {
        frRowLength = i + 1;
      }
    }
  }

  if (frRowLength !== currentfrRowLength) {
    const writableGridNode = gridNode.getWritable();

    if (frRowLength < currentfrRowLength) {
      // Remove the last frRowLength - currentfrRowLength
      writableGridNode.setFrRow([
        ...writableGridNode.frRow.slice(0, frRowLength),
      ]);
    } else {
      // Add the last frRowLength - currentfrRowLength
      writableGridNode.setFrRow([
        ...writableGridNode.frRow,
        ...Array(Math.abs(frRowLength - currentfrRowLength)).fill(1),
      ]);
    }

    writableGridNode.updateCSS();
  }
};
