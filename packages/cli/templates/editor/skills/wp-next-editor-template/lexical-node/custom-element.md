# Custom Element Node (`type: "custom-element"`)

## Purpose
Use as a generic container node with a configurable HTML tag (e.g. `section`, `article`, `header`, `footer`, `nav`, `main`). Similar to `wrapper` but lets you choose a semantically meaningful HTML5 container tag instead of always emitting a `<div>`. The allowed tags are a fixed set of block/container element types.

## Serialization
Serialized type: `SerializedCustomElementNode`

Node-specific field:
- `__elementType: HTMLContainerElementTag`

## Core Behavior
- Extends `WPElementNode`.
- Renders as `__elementType` in both empty/normal DOM init.
- Empty DOM mode sets default paddings if CSS is empty.
- `updateDOM()` remounts when element tag changes.

## Main APIs
- Factory: `$createCustomElementNode(node?)`
- Type guard: `$isCustomElementNode(node)`
