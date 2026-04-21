# Grid Node (`type: "grid"`)

## Purpose
Use to render CSS grid layouts that hold `grid-cell` children with configurable row/column fractions and flow direction.

## Serialization
Serialized type: `SerializedGridNode`

Node-specific fields:
- `__direction: "row" | "column"`

Exported JSON includes:
```json
{
  "type": "grid",
  "__direction": "row"
}
```
Plus base `WPElementNode` fields (`children`, `__css`, etc.).

## Core Behavior
- Extends `WPElementNode`.
- Stores grid sizing in CSS record fields (via `__css`):
  - `__frColumn` (defaults to `[1, 1]`) — array of fr values per column
  - `__frRow` (defaults to `[1, 1]`) — array of fr values per row
- **Important limitation:** `__frColumn`, `__frRow`, and the number of grid cells are the same across all devices. There is no per-device fr or cell count support — changes apply globally.
- `getCSS()` composes layout styles:
  - `display: grid`
  - `gridAutoFlow` from `__direction`
  - `gridTemplateColumns` / `gridTemplateRows` from fr arrays
  - default `gap: "20px 20px"` and paddings (`20px` all sides) if unset
  - `boxSizing: "border-box"`
- `updateCSS(setToDefaultDevice?)` writes computed grid CSS back into node CSS state.
- `initDOM()` creates a plain `<div>`.

## Main APIs
- `getFrs()` — returns `{ frColumn, frRow }`
- `frColumn` / `frRow` — getters reading from `__css`
- `setFrColumn(value)`, `setFrRow(value)` — write fr arrays into `__css`
- `updateDirection(direction)` — sets `__direction` (`"row"` | `"column"`)

## Grid Utility Functions

### Matrix conversion
- `$convertGridNodeToMatrix(gridNode)` — builds a 2D `GridCellNode[][]` matrix representing the visual grid layout, accounting for cell spans. Matrix height is `rowLength * 2` to accommodate span overflow.
- `$convertGridNodeToMatrixFromCell(gridCellNode)` — convenience wrapper: gets parent `GridNode` then calls `$convertGridNodeToMatrix`.
- `$rebuildGridNodeCellsFromMatrix(gridNode, cellMatrix)` — removes all existing grid cells and re-appends them in matrix order (deduplicating by key).

### Cell lookup
- `$findNeighborGridCells(gridCellNode)` — returns `{ top, bottom, left, right }` arrays of adjacent `GridCellNode`s (excluding the cell itself).
- `$findGridNodeCellsInRow(gridNode, rowIndex, { unique? })` — returns cells in a given row (1-indexed). If `unique: true`, deduplicates.
- `$findGridNodeCellsInColumn(gridNode, columnIndex, { unique? })` — returns cells in a given column (1-indexed). If `unique: true`, deduplicates.
- `$getGridCellRange(gridCellNode)` — returns `{ rowStart, rowEnd, rowLength, columnStart, columnEnd, columnLength }` (1-indexed).
- `$findCellsInRange(gridNode, columnStart, columnLength, rowStart, rowLength)` — returns unique cells within a rectangular range. Returns `[]` if any cell exceeds the range.

### Fr value updates
- `$updateGridFrValueByCell(editor, gridCellNode, delta, direction)` — adjusts the fr value of the row or column the cell starts in by `delta`. Minimum value is `0.25`.
- `$updateGridFrValue(editor, gridNode, value, direction, index)` — sets a specific fr value at `index` for the given direction and triggers CSS update.

### CSS updates
- `$updateGridCSS(editor, gridNode)` — applies `gridNode.getCSS()` via `$updateCSS`.
- `$updateGridCellCSS(editor, gridCellNode)` — applies `cell.getCSS()` via `$updateCSS`.

### Structural mutations (expand / delete)
All structural mutations apply to all devices (no per-device support).

- `$expandGridCell(editor, gridCellNode, position)` — adds a row (`"top"` / `"bottom"`) or column (`"left"` / `"right"`) adjacent to the given cell. Sets default device before mutating.
- `$expandGridColumn(editor, gridNode, args?)` — adds a column. Without `args`, appends to the end. With `{ gridCellNode, position }`, inserts before/after the cell's column. Extends span of spanned cells as needed.
- `$deleteGridColumn(editor, gridNode, columnIndex)` — removes the column at `columnIndex` (0-indexed), reducing spans of spanned cells.
- `$expandGridRow(editor, gridNode, args?)` — adds a row. Without `args`, appends to the end. With `{ gridCellNode, position }`, inserts before/after the cell's row. Extends span of spanned cells as needed.
- `$deleteGridRow(editor, gridNode, rowIndex)` — removes the row at `rowIndex` (0-indexed), reducing spans of spanned cells.
- `$updateGridTemplate(editor, gridNode, args)` — sets fr arrays and adds/removes rows or columns to match the new lengths. `args` is `{ frs, direction }[]`.

### Cell merge / unmerge
- `$checkMergeableOnGridCell(gridCellNode)` — returns positions (`"top"` | `"bottom"` | `"left"` | `"right"`) where the cell can be merged (neighbor cell has the same span width).
- `$mergeGridCell(editor, cell, position)` — merges the cell with its neighbor in `position`. Increases span accordingly and removes the neighbor from the matrix.
- `$unmergeGridCell(editor, cell)` — resets the cell to span 1×1 and fills vacated positions with new empty cells.

### Cell swap
- `$canSwapGridCells(fromGridCellNode, toGridCellNode)` — returns `true` if `from` can be swapped into the target range (from must be ≥ to in both dimensions, and from must not already be in the target range).
- `$swapGridCells(editor, fromGridCellNode, toGridCellNode)` — swaps the two cells in the matrix and rebuilds. Returns `true` on success.

### Adjustable fr check
- `$checkAdjustableFrOnGridCell(node)` — returns positions where the cell's fr boundary can be resized (i.e. the cell does not already start/end at the grid edge).

### Creation
- `$createGridNode(node?)` — creates a new `GridNode`, initializes CSS to default device, and populates it with a 2×2 grid of `GridCellNode`s (unless an existing `node` is passed for cloning context).
- `$isGridNode(node)` — type guard.
