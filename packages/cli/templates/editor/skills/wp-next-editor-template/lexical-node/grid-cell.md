# Grid Cell Node (`type: "grid-cell"`)

## Purpose
Use as children of `grid` nodes. Each cell controls column/row span and contributes CSS layout for placement in the parent grid.

## Serialization
Serialized type currently adds no extra exported fields beyond `SerializedWPElementNode`.

Exported JSON includes:
```json
{
  "type": "grid-cell"
}
```
Plus base `WPElementNode` fields (`children`, `__css`, etc.).

## Core Behavior
- Extends `WPElementNode`.
- Non-removable directly: `__removable = false`.
- Context-menu editing disabled: `__editableContextMenu = false`.
- Span values are stored in CSS under `__spans`:
  - `$__spanColumn` (default `1`)
  - `$__spanRow` (default `1`)
- `getCSS()` maps spans into layout CSS:
  - `gridColumn: "span {n}"`
  - `gridRow: "span {n}"`
- `updateCSS()` writes computed span layout back into CSS state.
- `initEmptyDOM()` sets default paddings.

## Main APIs
- `getSpans()`
- `updateSpans({ spanColumn, spanRow })`
- Getters/setters: `__spanColumn`, `__spanRow`
- Factory: `$createGridCellNode(node?)` (calls `updateCSS(true)` initially)
- Type guard: `$isGridCellNode(node)`
- `$updateSpans(editor, gridCellNode, span, setToDefaultDevice?)`
  - Updates cell spans
  - Recomputes required grid row count from matrix
  - Expands/shrinks parent `grid` fr rows and updates grid CSS
