# Widget Node (`type: "widget"`)

## Purpose
Use as a decorator wrapper that embeds a separately-managed widget template by its numeric `ID`. The widget's content is fetched and rendered as HTML at runtime; the node itself holds the rendered `innerHTML` and a nested editor state. Use when you need to reuse a standalone widget (a self-contained content block registered in the system) inside a page template.

## Serialization
Serialized type: `SerializedWidgetNode`

Node-specific fields:
- `ID: number`
- `collectionElementData?: { index: number; dataKey: string }`
- plus inherited decorator fields

## Core Behavior
- Extends `WPDecoratorNode`.
- Holds nested editor state and rendered HTML (`innerHTML`).
- `updateDOM()` uses `htmlIncrementalId` guard to avoid stale overwrite when HTML is updated programmatically.
- Empty when `ID === 0`.

## Main APIs
- Factory: `$createWidgetNode(node?)`
- Type guard: `$isWidgetNode(node)`
- `processWidget({ nodeKey, editor, options? })`
- `updateWidgetInnerHTML(...)` / cache helpers in same module
