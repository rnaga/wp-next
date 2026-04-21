# React Decorator Node (base class)

## Purpose

Abstract base class for decorator nodes that render React elements. Extends `WPDecoratorNode` and adds a numeric `ID` used to identify the DOM element via a `data-decorator-id` attribute. Concrete nodes (e.g. `widget`, `embed`, `image`) extend this class.

Do **not** use `ReactDecoratorNode` directly in JSON — it has no registered type string and is not instantiatable as a standalone node. Only its subclasses are used in templates.

## Serialized Fields

In addition to `WPDecoratorNode` base fields (`__css`, `__dynamicAttributes`):

- `ID: number` — randomly assigned 5-digit integer (0–99999), stable across serialize/deserialize cycles. Identifies the decorator's DOM container for React portal rendering.

## DOM

Creates a `<div>` with `data-decorator-id="<ID>"` attribute. React content is rendered into this element via a portal. Calls `initStyle` and `attachKey` on creation.

## Key Behaviors

- `isEmpty()` always returns `false` — decorators are never considered empty.
- `decorate()` returns `null` in the base class — subclasses override this to return a `ReactNode`.
- `REACT_DECORATOR_DATA_ATTRIBUTE = "data-decorator-id"` — the attribute used to locate the portal target in the DOM.

## Subclasses That Use This Base

Any node extending `ReactDecoratorNode` inherits the `ID` field. Known subclasses include decorator nodes for widget, embed, image, video, and similar content blocks. Check the specific node's doc for its full serialized shape.

## Main APIs

- `$isReactDecoratorNode(node)` — type guard for `ReactDecoratorNode` instances
- `$isReactDecoratorOrElementNode(node)` — type guard for both `ReactDecoratorNode` and `ReactElementDecoratorNode`
- Constant: `REACT_DECORATOR_DATA_ATTRIBUTE = "data-decorator-id"`
