# List Item Node (`type: "list-item"`)

## Purpose
Use as direct child elements inside `list` nodes. Each list-item renders as a `<li>` element. Must always be nested inside a `list` node — never used standalone. Supports full `WPElementNode` CSS and attributes.

## Serialization
Serialized type: `SerializedListItemNode` (`Spread<{}, SerializedWPElementNode>`)

## Core Behavior
- Extends `WPElementNode`.
- Renders as `<li>`.
- Empty DOM init sets default paddings if CSS is empty.

## Main APIs
- Factory: `$createListItemNode(node?)`
- Type guard: `$isListItemNode(node)`
