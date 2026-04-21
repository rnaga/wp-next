import { EditorConfig, LexicalEditor, LexicalNode, Spread } from "lexical";
import { CSSProperties } from "react";

import {
  CSS_DEFAULT_DEVICE,
  DEFAULT_STYLES,
} from "../../styles-core/constants";
import { CSSDevice } from "../../styles-core/css-device";
import { $updateCSS } from "../../styles-core/css";
import {
  $afterWPElementNodeCreation,
  SerializedWPElementNode,
  WPElementNode,
} from "../wp/WPElementNode";
import {
  $createGridCellNode,
  $isGridCellNode,
  GridCellNode,
} from "./GridCellNode";

import type * as types from "../../../types";
import { logger } from "../../logger";

type FrRowCSSRecord = types.CSSRecord<{
  $__frRow: number[];
}>;

export type SerializedGridNode = Spread<
  {
    //__frColumn: number[];
    //__frRowCSSRecord: FrRowCSSRecord;
    __direction: "row" | "column";
  },
  SerializedWPElementNode
>;

export class GridNode extends WPElementNode {
  //__frColumn: number[] = [1, 1];
  __direction: "row" | "column" = "row";

  // __frRowCSSRecord: FrRowCSSRecord = {
  //   ...DEFAULT_STYLES,
  //   desktop: {
  //     $__frRow: [1, 1],
  //   },
  // } as FrRowCSSRecord;

  static getType(): string {
    return "grid";
  }

  getFrs() {
    return {
      frColumn: this.frColumn,
      frRow: this.frRow,
    };
  }

  get frColumn(): number[] {
    return this.__css.get().__frColumn || [1, 1];
  }

  get frRow(): number[] {
    //const frRow = compileCSSRecord(this.__frRowCSSRecord);
    //return frRow?.$__frRow || [1, 1];
    return this.__css.get().__frRow || [1, 1];
  }

  setFrColumn(value: number[]) {
    this.__css.set({
      __frColumn: value,
    });
  }

  setFrRow(value: number[]) {
    // this.__frRowCSSRecord = processCSS(this.__frRowCSSRecord, {
    //   $__frRow: value,
    // });

    this.__css.set({
      __frRow: value,
    });
  }

  afterClone(prevNode: GridNode): void {
    super.afterClone(prevNode);
    //this.__frColumn = [...(prevNode.__frColumn ?? [1, 1])];
    //this.__frRowCSSRecord = prevNode.__frRowCSSRecord;
    this.__direction = prevNode.__direction;
  }

  static clone(node: GridNode): GridNode {
    const newNode = new GridNode(node.__key);
    newNode.afterClone(node);
    return newNode;
  }

  initEmptyDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    return document.createElement("div");
  }

  initDOM(config: EditorConfig, editor?: LexicalEditor): HTMLElement {
    const element = document.createElement("div");
    // this.__css.setDefaultIfEmpty({
    //   border: "1px solid grey",
    // });
    return element;
  }

  static importJSON(serializedNode: SerializedGridNode): GridNode {
    const node = new GridNode();
    node.importJSON(serializedNode);
    //node.__frColumn = serializedNode.__frColumn;
    //node.__frRowCSSRecord = serializedNode.__frRowCSSRecord;
    //node.__frRow = serializedNode.__frRow;
    node.__direction = serializedNode.__direction;
    return node;
  }

  exportJSON(): SerializedGridNode {
    return {
      ...super.exportJSON(),
      //__frColumn: this.__frColumn,
      //__frRowCSSRecord: this.__frRowCSSRecord,
      //__frRow: this.__frRow,
      __direction: this.__direction,
      type: "grid",
    };
  }

  getCSS() {
    const css = this.__css.get();

    return {
      ...css,
      __layout: {
        ...css.__layout,
        display: "grid",
        gridAutoFlow: this.__direction,
        gridTemplateColumns: this.frColumn.map((fr) => `${fr}fr`).join(" "),
        gridTemplateRows: this.frRow.map((fr) => `${fr}fr`).join(" "),
        gap: css.gap ?? "20px 20px",
        paddingTop: css.paddingTop ?? "20px",
        paddingBottom: css.paddingBottom ?? "20px",
        paddingLeft: css.paddingLeft ?? "20px",
        paddingRight: css.paddingRight ?? "20px",
        boxSizing: "border-box" as CSSProperties["boxSizing"],
      },
    };
  }

  updateCSS(setToDefaultDevice = false) {
    this.__css.set(
      this.getCSS(),
      setToDefaultDevice ? CSS_DEFAULT_DEVICE : undefined
    );
  }

  updateDirection(direction: "row" | "column") {
    this.__direction = direction;
  }
}

export type Position = "top" | "bottom" | "left" | "right";

export const $convertGridNodeToMatrix = (gridNode: GridNode) => {
  gridNode = gridNode.getLatest();
  // Get the length of the columns and rows
  const columnLength = gridNode.frColumn.length;
  const rowLength = gridNode.frRow.length;

  // Create a 2-dimensional array to represent the grid cell matrix.
  //
  // The row length is multiplied by 2 to accommodate potential row spans.
  // This ensures the matrix can handle grid cells that span multiple rows,
  // up to twice the current row length.
  const cellMatrix: GridCellNode[][] = new Array(rowLength * 2)
    .fill(null)
    .map(() => new Array(columnLength).fill(null));

  // get the grid cells
  const gridCells = gridNode
    .getLatest()
    .getChildren()
    .filter((child) => $isGridCellNode(child));

  const cellExists = (
    startColumn: number,
    columnSpan: number,
    startRow: number,
    rowSpan: number
  ) => {
    for (let i = startRow; i < startRow + rowSpan; i++) {
      for (let j = startColumn; j < startColumn + columnSpan; j++) {
        if (cellMatrix[i][j]) {
          return true;
        }
      }
    }
    return false;
  };

  const fillCellMatrix = (
    gridCell: GridCellNode,
    startColumn: number,
    columnSpan: number,
    startRow: number,
    rowSpan: number
  ) => {
    for (let i = startRow; i < startRow + rowSpan; i++) {
      for (let j = startColumn; j < startColumn + columnSpan; j++) {
        cellMatrix[i][j] = gridCell;
      }
    }
  };

  const columnExceeds = (startColumn: number, columnSpan: number) => {
    return startColumn + columnSpan > columnLength;
  };

  // Loop through the grid cells to fill the cell matrix
  let rowIndex = 0;
  for (const gridCell of gridCells) {
    // Determine new row index
    const columnSpan = gridCell.__spanColumn;
    const rowSpan = gridCell.__spanRow;

    // Loop through the cell matrix to find the target cell
    (() => {
      for (let i = rowIndex; i < rowLength + 1; i++) {
        for (let j = 0; j < columnLength; j++) {
          // Skip to the next row as the current cell does not fit in the current row
          if (columnExceeds(j, columnSpan)) {
            break;
          }

          if (cellExists(j, columnSpan, i, rowSpan)) {
            // If the cell exists, continue to the next column
            continue;
          }

          // If the cell does not exist, set the cell in the matrix
          fillCellMatrix(gridCell, j, columnSpan, i, rowSpan);

          // Update rowIndex to ensure the next iteration begins from the subsequent row
          rowIndex = i;
          return;
        }
      }
    })();
  }

  logger.log(
    "Grid cell matrix",
    cellMatrix.map((row) => {
      return row.map((cell) => {
        if (cell) {
          return cell.getKey();
        }
        return null;
      });
    })
  );

  return cellMatrix;
};

export const $convertGridNodeToMatrixFromCell = (
  gridCellNode: GridCellNode
): GridCellNode[][] => {
  const gridNode = gridCellNode.getParent() as GridNode;
  return $convertGridNodeToMatrix(gridNode);
};

export const $rebuildGridNodeCellsFromMatrix = (
  gridNode: GridNode,
  cellMatrix: (GridCellNode | null)[][]
) => {
  // Clear the existing cells in the grid node
  const children = gridNode.getChildren();
  for (const child of children) {
    if ($isGridCellNode(child)) {
      child.remove();
    }
  }

  const addedKeysList = new Set<string>();

  let prevCell = null as GridCellNode | null;
  for (let i = 0; i < cellMatrix.length; i++) {
    const cellsInRow = Array.from(new Set(cellMatrix[i]));
    for (let j = 0; j < cellsInRow.length; j++) {
      const cell = cellsInRow[j];

      // Skip processing if the cell is null
      if (!cell) {
        continue;
      }

      const cellKey = cell.getKey();

      // Skip if the cell key is already added
      if (addedKeysList.has(cellKey)) {
        continue;
      }

      addedKeysList.add(cellKey);

      if (i == 0 && j == 0) {
        // If the cell is the first cell, append it to the grid node
        gridNode.getWritable().append(cell);
      } else {
        prevCell?.getLatest().getWritable().insertAfter(cell);
      }

      prevCell = cell;
    }
  }
};

export const $findNeighborGridCells = (gridCellNode: GridCellNode) => {
  gridCellNode = gridCellNode.getLatest();
  const gridNode = gridCellNode.getLatest().getParent() as GridNode;

  const neighborCells = {
    top: [] as GridCellNode[],
    bottom: [] as GridCellNode[],
    left: [] as GridCellNode[],
    right: [] as GridCellNode[],
  };

  const cellMatrix = $convertGridNodeToMatrix(gridNode);
  const rowLength = cellMatrix.length;

  for (let i = 0; i < rowLength; i++) {
    const columnLength = cellMatrix[i].length;
    for (let j = 0; j < columnLength; j++) {
      const cell = cellMatrix[i][j];

      // Check if the cell is the same as the target cell
      if (cell && cell.getKey() === gridCellNode.getKey()) {
        // Check the top cell
        const topCell = cellMatrix[i - 1]?.[j];
        // Check if the top cell exists and is not the same as the target cell
        if (topCell && topCell.getKey() !== gridCellNode.getKey()) {
          neighborCells.top.push(topCell);
        }

        // Check other neighbor cells with the same logic

        const bottomCell = cellMatrix[i + 1]?.[j];
        if (bottomCell && bottomCell.getKey() !== gridCellNode.getKey()) {
          neighborCells.bottom.push(bottomCell);
        }

        const leftCell = cellMatrix[i]?.[j - 1];
        if (leftCell && leftCell.getKey() !== gridCellNode.getKey()) {
          neighborCells.left.push(leftCell);
        }

        const rightCell = cellMatrix[i]?.[j + 1];
        if (rightCell && rightCell.getKey() !== gridCellNode.getKey()) {
          neighborCells.right.push(rightCell);
        }
      }
    }
  }

  return neighborCells;
};

export const $findGridNodeCellsInRow = (
  gridNode: GridNode,
  rowIndex: number,
  options?: {
    unique: boolean;
  }
): GridCellNode[] => {
  const { unique = false } = options || {};
  const cellMatrix = $convertGridNodeToMatrix(gridNode);
  const rowCells = cellMatrix[rowIndex - 1];

  if (!unique) {
    return rowCells;
  }

  // If unique is true, filter out duplicate cells
  const uniqueCells = new Set<GridCellNode>();
  for (const cell of rowCells) {
    if (cell) {
      uniqueCells.add(cell);
    }
  }
  return Array.from(uniqueCells);
};

export const $findGridNodeCellsInColumn = (
  gridNode: GridNode,
  columnIndex: number,
  options?: {
    unique: boolean;
  }
): GridCellNode[] => {
  const { unique = false } = options || {};
  const cellMatrix = $convertGridNodeToMatrix(gridNode);
  const columnCells = cellMatrix.map((row) => row[columnIndex - 1]);

  if (!unique) {
    return columnCells;
  }

  // If unique is true, filter out duplicate cells
  const uniqueCells = new Set<GridCellNode>();
  for (const cell of columnCells) {
    if (cell) {
      uniqueCells.add(cell);
    }
  }

  return Array.from(uniqueCells);
};

export const $getGridCellRange = (gridCellNode: GridCellNode) => {
  const gridNode = gridCellNode.getLatest().getParent() as GridNode;
  const cellMatrix = $convertGridNodeToMatrix(gridNode);

  const range = {
    rowStart: 0,
    rowEnd: 0,
    rowLength: 0,
    columnStart: 0,
    columnEnd: 0,
    columnLength: 0,
  };

  for (let i = 0; i < cellMatrix.length; i++) {
    const row = cellMatrix[i];
    for (let j = 0; j < row.length; j++) {
      const cell = row[j];
      if (cell && cell.getKey() === gridCellNode.getKey()) {
        // Set rowStart if its not set (0)
        range.rowStart = range.rowStart === 0 ? i + 1 : range.rowStart;

        // Set rowEnd if its not set (0) or less than the current row index
        range.rowEnd =
          !range.rowEnd || range.rowEnd < i + 1 ? i + 1 : range.rowEnd;

        // Set columnStart if its not set (0)
        range.columnStart = range.columnStart === 0 ? j + 1 : range.columnStart;

        // Set columnEnd if its not set (0) or less than the current column index
        range.columnEnd =
          !range.columnEnd || range.columnEnd < j + 1 ? j + 1 : range.columnEnd;
      }
    }
  }

  range.rowLength = range.rowEnd - range.rowStart + 1;
  range.columnLength = range.columnEnd - range.columnStart + 1;

  return range;
};

export const $updateGridFrValueByCell = (
  editor: LexicalEditor,
  gridCellNode: GridCellNode,
  delta: number,
  direction: "row" | "column"
) => {
  // Find the grid node
  const gridNode = gridCellNode.getLatest().getParent() as GridNode;

  const cellRange = $getGridCellRange(gridCellNode);

  const index =
    direction === "row" ? cellRange.rowStart - 1 : cellRange.columnStart - 1;

  // Get the current fr value
  const currValue =
    direction === "row" ? gridNode.frRow[index] : gridNode.frColumn[index];

  // if the value is less than 0.25, return
  if (currValue + delta < 0.25) {
    logger.log( "Value is less than 0.25");
    return;
  }

  const value = currValue + delta;

  $updateGridFrValue(editor, gridNode, value, direction, index);
};

export const $updateGridCSS = (editor: LexicalEditor, gridNode: GridNode) => {
  $updateCSS({
    editor,
    node: gridNode,
    styles: gridNode.getCSS(),
  });
};

export const $updateGridCellCSS = (
  editor: LexicalEditor,
  cell: GridCellNode
) => {
  $updateCSS({
    editor,
    node: cell,
    styles: cell.getCSS(),
  });
};

export const $updateGridFrValue = (
  editor: LexicalEditor,
  gridNode: GridNode,
  value: number,
  direction: "row" | "column",
  index: number
) => {
  if (direction === "row") {
    // Since __frRow is a CSSRecord, we need to set the value in the CSSRecord
    const newFrRow = gridNode.frRow.map((fr, i) => {
      if (i === index) {
        return parseFloat(value.toFixed(2));
      }
      return fr;
    });

    const writable = gridNode.getWritable();
    writable.setFrRow(newFrRow);

    $updateGridCSS(editor, writable);
  } else {
    //gridNode.__frColumn[index] = parseFloat(value.toFixed(2));

    let frColumn = gridNode.frColumn;
    frColumn[index] = parseFloat(value.toFixed(2));
    gridNode.setFrColumn(frColumn);

    $updateGridCSS(editor, gridNode);
  }
};

export const $updateGridTemplate = (
  editor: LexicalEditor,
  gridNode: GridNode,
  args: {
    frs: number[];
    direction: "row" | "column";
  }[]
) => {
  for (const { frs, direction } of args) {
    // calculate the number of columns or rows, and add the fr values
    // also append or remove cells as needed

    // if the direction is row, update the rows
    if (direction === "row") {
      const diff = frs.length - gridNode.frRow.length;
      gridNode.setFrRow(frs);

      if (diff > 0) {
        for (let i = 0; i < diff; i++) {
          $expandGridRow(editor, gridNode);
        }
      } else if (diff < 0) {
        for (let i = 0; i < -diff; i++) {
          $deleteGridRow(editor, gridNode, gridNode.frRow.length - 1);
        }
      }
      continue;
    }

    // if the direction is column, update the columns
    const diff = frs.length - gridNode.frColumn.length;
    gridNode.setFrColumn(frs);
    //gridNode.__frColumn = frs;

    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        $expandGridColumn(editor, gridNode);
      }
    } else if (diff < 0) {
      for (let i = 0; i < -diff; i++) {
        $deleteGridColumn(editor, gridNode, gridNode.frColumn.length - 1);
      }
    }
  }

  $updateGridCSS(editor, gridNode);
};

export const $expandGridCell = (
  editor: LexicalEditor,
  gridCellNode: GridCellNode,
  position: Position
) => {
  // Set the default device - mutating grid cell applies to all devices
  CSSDevice.setDefaultDevice();

  const gridNode = gridCellNode.getLatest().getParent() as GridNode;

  if (!gridNode) {
    logger.warn( "Grid node not found");
    return;
  }

  if (position === "top" || position === "bottom") {
    $expandGridRow(editor, gridNode, { gridCellNode, position });
  } else {
    $expandGridColumn(editor, gridNode, { gridCellNode, position });
  }

  // Restore the device
  CSSDevice.restoreDevice();
};

export const $expandGridColumn = (
  editor: LexicalEditor,
  gridNode: GridNode,
  args?: {
    gridCellNode: GridCellNode;
    position: "left" | "right";
  }
) => {
  const { gridCellNode, position } = args || {};
  logger.log( "expandGridColumn", gridCellNode, position);

  gridNode = gridNode.getWritable();

  const cellsMatrix = $convertGridNodeToMatrix(gridNode);

  const rowLength = gridNode.frRow.length;
  const newColumnIndex = (() => {
    if (!gridCellNode) {
      // If no grid cell node is provided, add a new column at the end
      return gridNode.frColumn.length;
    }

    const cellRange = $getGridCellRange(gridCellNode);
    return position === "left"
      ? cellRange.columnStart - 1
      : cellRange.columnEnd;
  })();

  if (!gridCellNode) {
    // If no grid cell node is provided, add a new column at the end
    const frColumn = gridNode.frColumn;
    frColumn.push(1);
    gridNode.setFrColumn(frColumn);
    //gridNode.__frColumn.push(1);

    for (let i = 0; i < rowLength; i++) {
      const newCell = $createGridCellNode();
      cellsMatrix[i].push(newCell);
    }
  } else {
    const addedKeys = new Set<string>();

    for (let i = 0; i < rowLength; i++) {
      const cell = cellsMatrix[i][newColumnIndex];

      if (
        cell?.__spanColumn &&
        cell.__spanColumn > 1 &&
        ((position === "right" &&
          cellsMatrix[i][newColumnIndex]?.getKey() === cell.getKey()) ||
          (position === "left" &&
            cellsMatrix[i][newColumnIndex]?.getKey() === cell.getKey()))
      ) {
        cellsMatrix[i].splice(newColumnIndex, 0, cell);

        if (addedKeys.has(cell.getKey())) {
          continue;
        }

        // If the cell is in the neighbor column and span has not changed,
        // set the span to the current column span
        const writableCell = cell.getWritable();
        writableCell.__spanColumn++;
        writableCell.updateCSS();

        addedKeys.add(cell.getKey());
      } else {
        const newGridNodeCell = $createGridCellNode();
        cellsMatrix[i].splice(newColumnIndex, 0, newGridNodeCell);
      }
    }

    //gridNode.__frColumn.splice(newColumnIndex, 0, 1);

    const frColumn = gridNode.frColumn;
    frColumn.splice(newColumnIndex, 0, 1);
    gridNode.setFrColumn(frColumn);
  }

  $rebuildGridNodeCellsFromMatrix(gridNode, cellsMatrix);

  $updateGridCSS(editor, gridNode);
};

export const $deleteGridColumn = (
  editor: LexicalEditor,
  gridNode: GridNode,
  columnIndex: number
) => {
  gridNode = gridNode.getWritable();

  const cellsMatrix = $convertGridNodeToMatrix(gridNode);
  const rowLength = gridNode.frRow.length;

  const deletedKeys = new Set<string>();

  for (let i = 0; i < rowLength; i++) {
    const cell = cellsMatrix[i][columnIndex];

    if (cell.__spanColumn > 1 && !deletedKeys.has(cell.getKey())) {
      const writable = cell.getWritable();
      writable.__spanColumn--;
      writable.updateCSS();

      deletedKeys.add(cell.getKey());
    }

    // splice the cell from the matrix
    cellsMatrix[i].splice(columnIndex, 1);
  }

  // Remove the column
  const frColumn = [...gridNode.frColumn];
  frColumn.splice(columnIndex, 1);
  gridNode.setFrColumn(frColumn);

  $rebuildGridNodeCellsFromMatrix(gridNode, cellsMatrix);

  $updateGridCSS(editor, gridNode);
};

export const $expandGridRow = (
  editor: LexicalEditor,
  gridNode: GridNode,
  args?: {
    gridCellNode: GridCellNode;
    position: "top" | "bottom";
  }
) => {
  const { gridCellNode, position } = args || {};

  let newRowIndex = 0;

  // Make the grid node writable before updating grid and cells
  gridNode = gridNode.getWritable();

  const cellsMatrix = $convertGridNodeToMatrix(gridNode);

  const columnLength = gridNode.frColumn.length;

  // Create a new row with null
  let newRow: GridCellNode[] = new Array(columnLength).fill(null);

  // Update the row fr values in the grid node
  if (!gridCellNode) {
    // If no grid cell node is provided, add a new row at the end
    gridNode.setFrRow([...gridNode.frRow, 1]);
    newRowIndex = gridNode.frRow.length - 1;

    for (let i = 0; i < gridNode.frColumn.length; i++) {
      const newCell = $createGridCellNode();
      newRow[i] = newCell;
    }

    gridNode.updateCSS();
  } else {
    const cellRange = $getGridCellRange(gridCellNode);

    newRowIndex =
      position === "top" ? cellRange.rowStart - 1 : cellRange.rowEnd;
    const currentRow = cellsMatrix[newRowIndex];

    const addedKeys = new Set<string>();

    for (let i = 0; i < columnLength; i++) {
      const cell = currentRow?.[i];

      // Check if the cell is spanned and if the cell is in the neighbor row
      if (
        cell &&
        ((position === "top" &&
          cell.__spanRow > 1 &&
          cellsMatrix[newRowIndex - 1]?.[i].getKey() === cell.getKey()) ||
          (position === "bottom" &&
            cell.__spanRow > 1 &&
            cellsMatrix[newRowIndex]?.[i].getKey() === cell.getKey()))
      ) {
        newRow[i] = cell;

        if (addedKeys.has(cell.getKey())) {
          continue;
        }

        // If the cell is in the neighbor column and span has not changed,
        // set the span to the current column span
        const writableCell = cell.getWritable();
        writableCell.__spanRow++;
        writableCell.updateCSS();

        addedKeys.add(cell.getKey());
      } else {
        const newGridNodeCell = $createGridCellNode();
        newRow[i] = newGridNodeCell;
      }
    }

    let newFrRow = gridNode.frRow;
    newFrRow.splice(newRowIndex, 0, 1);

    gridNode.setFrRow(newFrRow);
    gridNode.updateCSS();
  }

  cellsMatrix.splice(newRowIndex, 0, newRow);

  $rebuildGridNodeCellsFromMatrix(gridNode, cellsMatrix);

  $updateGridCSS(editor, gridNode);
};

export const $deleteGridRow = (
  editor: LexicalEditor,
  gridNode: GridNode,
  rowIndex: number
) => {
  gridNode = gridNode.getWritable();

  const cellsMatrix = $convertGridNodeToMatrix(gridNode);
  const columnLength = gridNode.frColumn.length;

  const deletedKeys = new Set<string>();

  for (let i = 0; i < columnLength; i++) {
    const cell = cellsMatrix[rowIndex][i];

    if (cell.__spanRow > 1 && !deletedKeys.has(cell.getKey())) {
      const writable = cell.getWritable();
      writable.__spanRow--;
      writable.updateCSS();

      deletedKeys.add(cell.getKey());
    }
  }

  // splice the cell from the matrix
  cellsMatrix.splice(rowIndex, 1);

  // Remove the row by filtering out the rowIndex
  const newFrRow = gridNode.frRow.filter((_, i) => i !== rowIndex);

  const writableGridNode = gridNode.getWritable();
  writableGridNode.setFrRow(newFrRow);
  writableGridNode.updateCSS();

  $rebuildGridNodeCellsFromMatrix(writableGridNode, cellsMatrix);

  $updateGridCSS(editor, gridNode.getLatest().getWritable());
};

export const $findCellsInRange = (
  gridNode: GridNode,
  columnStart: number,
  columnLength: number,
  rowStart: number,
  rowLength: number
) => {
  const cellMatrix = $convertGridNodeToMatrix(gridNode);
  const cellsInRange: GridCellNode[] = [];

  const maxColumnLength = gridNode.frColumn.length;
  const maxRowLength = gridNode.frRow.length;

  const rowEnd = rowStart - 1 + rowLength;
  const columnEnd = columnStart - 1 + columnLength;

  if (columnEnd > maxColumnLength || rowEnd > maxRowLength) {
    logger.log( "columnEnd or rowEnd exceeds the grid node length");
    return [];
  }

  const cellChecked = new Set<string>();

  for (let i = rowStart - 1; i < rowEnd; i++) {
    const row = cellMatrix[i];
    for (let j = columnStart - 1; j < columnEnd; j++) {
      const cell = row[j];
      if (!cell || cellChecked.has(cell.getKey())) {
        // Skip if the cell is null or already checked
        continue;
      }
      // Check if cell doesn't exceed the column length and row length
      if (i + cell.__spanRow > rowEnd || j + cell.__spanColumn > columnEnd) {
        logger.log(
          "Cell exceeds the column length or row length",
          cell.getKey()
        );
        return [];
      }

      cellsInRange.push(cell);

      cellChecked.add(cell.getKey());
    }
  }

  return Array.from(new Set(cellsInRange));
};

export const $swapGridCells = (
  editor: LexicalEditor,
  fromGridCellNode: GridCellNode,
  toGridCellNode: GridCellNode
): boolean => {
  let gridNode = fromGridCellNode.getParents().find((parent) => {
    return $isGridNode(parent);
  }) as GridNode;

  if (!gridNode) {
    logger.warn( "Grid node not found");
    return false;
  }

  gridNode = gridNode.getWritable();

  const fromCellRange = $getGridCellRange(fromGridCellNode);
  const toCellRange = $getGridCellRange(toGridCellNode);

  const cellsMatrix = $convertGridNodeToMatrix(gridNode);

  // Loop through the cells in the matrix
  for (let i = 0; i < fromCellRange.rowLength; i++) {
    for (let j = 0; j < fromCellRange.columnLength; j++) {
      // Swap the cells in the matrix

      // toCell -> fromCell
      cellsMatrix[fromCellRange.rowStart - 1 + i][
        fromCellRange.columnStart - 1 + j
      ] =
        cellsMatrix[toCellRange.rowStart - 1 + i][
          toCellRange.columnStart - 1 + j
        ];

      // fromCell -> toCell (note: all cells in fromCellRange are the same)
      cellsMatrix[toCellRange.rowStart - 1 + i][
        toCellRange.columnStart - 1 + j
      ] = fromGridCellNode;
    }
  }

  // Rebuild the grid node cells from the matrix
  $rebuildGridNodeCellsFromMatrix(gridNode, cellsMatrix);

  $updateGridCSS(editor, gridNode);

  return true;
};

export const $canSwapGridCells = (
  fromGridCellNode: GridCellNode,
  toGridCellNode: GridCellNode
): boolean => {
  const fromCellRange = $getGridCellRange(fromGridCellNode);
  const toCellRange = $getGridCellRange(toGridCellNode);

  const fromCellRowLength = fromCellRange.rowEnd - fromCellRange.rowStart + 1;
  const fromCellColumnLength =
    fromCellRange.columnEnd - fromCellRange.columnStart + 1;

  const toCellRowLength = toCellRange.rowEnd - toCellRange.rowStart + 1;
  const toCellColumnLength =
    toCellRange.columnEnd - toCellRange.columnStart + 1;

  const gridNode = fromGridCellNode.getParent() as GridNode;

  const diffRowLength = fromCellColumnLength - toCellColumnLength;
  const diffColumnLength = fromCellRowLength - toCellRowLength;

  if (diffRowLength < 0 || diffColumnLength < 0) {
    // toGridCellNode is larger than fromGridCellNode so we can't swap
    return false;
  }

  const cellsInRange = $findCellsInRange(
    gridNode,
    toCellRange.columnStart,
    fromCellColumnLength,
    toCellRange.rowStart,
    fromCellRowLength
  );

  const fromCellExistsInRange = cellsInRange.some((cell) => {
    return cell.getKey() === fromGridCellNode.getKey();
  });

  return cellsInRange.length > 0 && !fromCellExistsInRange;
};

export const $checkMergeableOnGridCell = (gridCellNode: GridCellNode) => {
  const availableDirections: Position[] = [];
  const neighborCells = $findNeighborGridCells(gridCellNode);

  for (const position of ["top", "bottom", "left", "right"] as Position[]) {
    const cellsInPosition = neighborCells[position];

    if (cellsInPosition.length === 0) {
      // No cells in this position so we can't merge
      continue;
    }

    const initialNodeKey = cellsInPosition[0]?.getKey();

    // Check if all cells in this position have the same key
    const allCellsHaveSameKey = cellsInPosition.every((cell) => {
      return cell.getKey() === initialNodeKey;
    });

    const neighborCellSpanLength =
      position === "top" || position === "bottom"
        ? neighborCells[position][0].__spanColumn
        : neighborCells[position][0].__spanRow;

    const gridNodeCellSpanLength =
      position === "top" || position === "bottom"
        ? gridCellNode.__spanColumn
        : gridCellNode.__spanRow;

    if (
      allCellsHaveSameKey &&
      neighborCellSpanLength === gridNodeCellSpanLength
    ) {
      // If all cells have the same key, we can merge
      availableDirections.push(position);
    }
  }

  return availableDirections;
};

export const $checkAdjustableFrOnGridCell = (node: GridCellNode) => {
  const availableDirections: Position[] = [];
  const gridNode = node.getParents().find($isGridNode);

  if (!gridNode) return availableDirections;

  const numberOfColumns = gridNode.frColumn.length;
  const numberOfRows = gridNode.frRow.length;

  const cellRange = $getGridCellRange(node);

  for (const position of ["top", "bottom", "left", "right"] as Position[]) {
    switch (position) {
      case "top":
        // If Row start is larger than, then it's  adjustable
        //if (node.__span.rowStart > 1) {
        if (cellRange.rowStart > 1) {
          availableDirections.push(position);
        }
        break;
      case "bottom":
        // If Row end is less than the number of rows, then it's adjustable
        //if (node.__span.rowEnd < numberOfRows) {
        if (cellRange.rowEnd < numberOfRows) {
          availableDirections.push(position);
        }
        break;
      case "left":
        // If Column start is larger than, then it's  adjustable
        //if (node.__span.columnStart > 1) {
        if (cellRange.columnStart > 1) {
          availableDirections.push(position);
        }
        break;
      case "right":
        // If Column end is less than the number of columns, then it's adjustable
        //if (node.__span.columnEnd < numberOfColumns) {
        if (cellRange.columnEnd < numberOfColumns) {
          availableDirections.push(position);
        }
        break;
    }
  }

  return availableDirections;
};

export const $mergeGridCell = (
  editor: LexicalEditor,
  cell: GridCellNode,
  position: Position
) => {
  // Set the default device - mutating grid cell applies to all devices
  CSSDevice.setDefaultDevice();

  const neighborCells = $findNeighborGridCells(cell);

  const neighborCellToMerge =
    position === "top"
      ? neighborCells.top[0]
      : position === "bottom"
        ? neighborCells.bottom[0]
        : position === "left"
          ? neighborCells.left[0]
          : neighborCells.right[0];

  const writableCell = cell.getWritable();
  const neighborCellsRange = $getGridCellRange(neighborCellToMerge);

  const gridNode = cell.getLatest().getParent() as GridNode;

  const cellsMatrix = $convertGridNodeToMatrixFromCell(cell);

  // fill the cells in the matrix with the cell to merge
  for (
    let i = neighborCellsRange.rowStart - 1;
    i <= neighborCellsRange.rowEnd - 1;
    i++
  ) {
    for (
      let j = neighborCellsRange.columnStart - 1;
      j <= neighborCellsRange.columnEnd - 1;
      j++
    ) {
      cellsMatrix[i][j] = cell;
    }
  }

  // Update the span of the cell
  switch (position) {
    case "top":
    case "bottom":
      writableCell.__spanRow += neighborCellToMerge.__spanRow;
      break;
    case "left":
    case "right":
      writableCell.__spanColumn += neighborCellToMerge.__spanColumn;
      break;
  }

  // Remove the span of the neighbor cell
  // $removeNode(neighborCellToMerge.getWritable(), {
  //   force: true,
  // });

  const writableGridNode = gridNode.getLatest().getWritable();
  $rebuildGridNodeCellsFromMatrix(writableGridNode, cellsMatrix);

  $updateGridCellCSS(editor, writableCell);

  // Restore the device
  CSSDevice.restoreDevice();

  return true;
};

export const $unmergeGridCell = (editor: LexicalEditor, cell: GridCellNode) => {
  CSSDevice.setDefaultDevice();

  //const writableCell = cell.getWritable();
  const cellRange = $getGridCellRange(cell);

  const gridNode = cell.getLatest().getParent() as GridNode;

  const cellsMatrix = $convertGridNodeToMatrix(gridNode);

  const columnStart = cellRange.columnStart;
  const columnEnd = cellRange.columnEnd;

  const rowStart = cellRange.rowStart;
  const rowEnd = cellRange.rowEnd;

  for (let i = rowStart; i <= rowEnd; i++) {
    for (let j = columnStart; j <= columnEnd; j++) {
      if (i === rowStart && j === columnStart) {
        cellsMatrix[i - 1][j - 1] = cell; //writableCell;
        continue;
      }

      const newCell = $createGridCellNode();
      cellsMatrix[i - 1][j - 1] = newCell;
    }
  }

  // Reset the span of the cell
  const writableCell = cell.getWritable();
  writableCell.__spanColumn = 1;
  writableCell.__spanRow = 1;

  writableCell.updateCSS();

  const writableGridNode = gridNode.getWritable();

  // Re-order the cells in the grid node
  $rebuildGridNodeCellsFromMatrix(writableGridNode, cellsMatrix);

  // This triggers editor command NODE_PROPERTY_UPDATED which updates the offset of mouse tool box
  $updateGridCSS(editor, writableGridNode.getLatest().getWritable());

  CSSDevice.restoreDevice();
};

export const $createGridNode = (node?: GridNode): GridNode => {
  const grid = new GridNode();
  $afterWPElementNodeCreation(grid, node);

  // Set the initial CSS to default device (desktop)
  grid.updateCSS(true);

  const rows = grid.frRow.length;
  const columns = grid.frColumn.length;

  // Add the initial cells (2x2) when node is not passed
  if (!node) {
    // Add the initial cells (2x2)
    for (let i = 0; i < rows; i++) {
      // create a new cell and append it to the end
      const newCell = $createGridCellNode();
      newCell.updateSpans(
        {
          spanColumn: 1,
          spanRow: 1,
        },
        // setToDefaultDevice is set to true to set the CSS to default device
        true
      );
      grid.append(newCell);

      for (let j = 1, currentCell = newCell; j < columns; j++) {
        const cell = $createGridCellNode();
        cell.updateSpans(
          {
            spanColumn: 1,
            spanRow: 1,
          },
          // setToDefaultDevice is set to true to set the CSS to default device
          true
        );
        currentCell.insertAfter(cell);
        currentCell = cell;
      }
    }
  }

  return grid;
};

export const $isGridNode = (
  node: LexicalNode | null | undefined
): node is GridNode => {
  return node instanceof GridNode;
};
