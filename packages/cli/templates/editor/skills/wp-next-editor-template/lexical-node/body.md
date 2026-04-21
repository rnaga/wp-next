# Body Node (`type: "body"`)

## Purpose
The body node is the required top-level content container for every page. It is always the direct child of root and wraps all page content (sections, grids, headings, etc.). Use it to set page-wide styles such as font-family, font-size, and background-color.

## Serialization
Serialized type: `SerializedBodyNode` (`Spread<{}, SerializedWPElementNode>`)

Exported JSON shape:
```json
{
  "type": "body",
  "version": 1,
  "children": [],
  "__css": {},
  "__attributes": {},
  "__dynamicAttributes": {}
}
```

## Core Behavior
- Extends `WPElementNode`.
- Non-removable: `__removable = false` (cannot be deleted from the UI).
- `__heightWhenEmpty` is `50px`.
- DOM representation: renders as a `<div data-lexical-body="true">`.

## Helpers
- Factory: `$createBodyNode()`
- Type guard: `$isBodyNode(node)`
- Clone: `BodyNode.clone(node)` preserves base `WPElementNode` state via `afterClone`.

## Usage Rules
- Every page must have **exactly one** body node as a direct child of root.
- All other content nodes must be nested inside the body node.
- Do **not** use `"main-wrapper"` in `__externalClassNames` — that pattern is obsolete. The body node replaces the old main-wrapper wrapper node.
