# List Node (`type: "list"`)

## Purpose
Use as the container for list items, with list type (`ul`/`ol`) and bullet visibility control.

## Serialization
Serialized type: `SerializedListNode`

Node-specific fields:
- `__listType: "ul" | "ol"`
- `__withBullets: boolean`

## Core Behavior
- Extends `WPElementNode`.
- Renders as `<ul>` or `<ol>`.
- `setBulletType()` toggles `list-style-type: none` when bullets are disabled.
- Empty when there are no children.

## Main APIs
- Factory: `$createListNode(node?)`
- Type guard: `$isListNode(node)`
