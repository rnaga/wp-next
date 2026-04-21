# Link Node (`type: "link"`)

## Purpose
Use for anchor/link containers with template-processed href values and configurable targets.

## Serialization
Serialized type: `SerializedLinkNode`

Node-specific fields:
- `__href: string`
- `__target: "_blank" | "_self" | "_parent" | "_top"`

Exported JSON includes:
```json
{
  "type": "link",
  "__href": "https://...",
  "__target": "_self"
}
```
Plus base `WPElementNode` fields.

## Core Behavior
- Extends `WPElementNode`.
- Renders as `<a>` in both empty and normal DOM init.
- Stores raw href in `__href` and processed runtime value in `__processedHref`.
- `loadLink({ data })` resolves templated href using `$processTemplateText(...)`, updates `__processedHref`, and marks node dirty.
- `updateDOM()` applies `href` from `__processedHref`.
- `initDOM()` applies target and default inline-block paddings/layout CSS.
- `__heightWhenEmpty = 50`.

## Main APIs
- Factory: `$createLinkNode(node?)`
- Type guard: `$isLinkNode(node)`
- Related type guard: `$isLinkRelatedNode(node)` (`link` or `button-link`)
- `$loadTemplateLink(node)`:
  - Calls `loadLink()` on link-related nodes
  - Syncs siblings inside parent collection via `$syncParentCollections(...)`
