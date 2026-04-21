# Wrapper Node (`type: "wrapper"`)

## Purpose
Use as a generic block container node for page sections and nested content. It is the primary building block for layout regions — typically used to create rows, columns, hero areas, footers, and any freeform section that holds other nodes. Renders as a `<div>` with optional CSS applied.

## Serialization
Serialized type: `SerializedWrapperNode` (`Spread<{}, SerializedWPElementNode>`)

Exported JSON shape:
```json
{
  "type": "wrapper",
  "version": 1,
  "children": [],
  "__css": {},
  "__attributes": {},
  "__dynamicAttributes": {}
}
```

## Core Behavior
- Extends `WPElementNode`.
- `initEmptyDOM()` creates a `div` and sets default paddings when CSS is empty.
- `initDOM()` creates a `div` for normal rendering.
- `__heightWhenEmpty` is `50`.

## Helpers
- Factory: `$createWrapperNode(node?)`
- Type guard: `$isWrapperNode(node)`
- Clone: `WrapperNode.clone(node)` preserves base `WPElementNode` state via `afterClone`.
