# Widget Root Node (`type: "widget-root"`)

## Purpose
A special root-level marker node placed at the top of a widget's own editor state (not in a page editor). It identifies the editor as a widget context and carries the widget's `ID` and optional `collectionReferenceData`. You will never add this node manually to a page template — it is managed internally by the widget system.

## Serialization
Serialized type: `SerializedWidgetRootNode`

Node-specific fields:
- `ID: number`
- `collectionReferenceData?: any`

## Core Behavior
- Extends `DecoratorNode`.
- Renders an empty `<div>` and no React decoration (`decorate() => undefined`).

## Main APIs
- Factory: `$createWidgetRootNode(node?)`
- Type guard: `$isWidgetRootNode(node)`
