# Collection Element Node (`type: "collection-element"`)

## Purpose
Use as a per-item instance inside a `collection` node. Each collection-element represents one item from the fetched data array. Only the first element (template) is saved in JSON; runtime clones it for remaining items.

## Serialization
Serialized type: `SerializedCollectionElementNode` (extends `SerializedWPElementNode`)

Node-specific field:
- `__isCollectionElement: boolean` — always `true`

Inherited from `WPElementNode`:
- `__css` — style object (see styles.md)
- `__attributes` — HTML attributes
- `__dynamicAttributes` — conditional attribute rules (optional)

Inherited from Lexical `ElementNode`:
- `children`, `direction`, `format`, `indent`, `version`

## Core Behavior
- Non-editable/non-removable in UI (runtime-only flags, not serialized)
- Resolves own index within parent collection and derives item data from fetched cache
- `refreshNodes()` updates nested `template-text` and link nodes with this element's data context
- Children contain the actual template content (wrappers, template-text nodes, images, etc.)

## Data Resolution

Each collection-element resolves its data by:
1. Finding its index within parent collection's children
2. Looking up `$getFetchedData(parentCollection.__dataNodeNameDotField)`
3. Returning `data[index]` for its specific item

This data is then available to descendant `template-text` nodes via `$processTemplateText`.

## JSON Example

```json
{
  "type": "collection-element",
  "__isCollectionElement": true,
  "__css": {
    "__className": "",
    "__externalClassNames": "",
    "__styles": {
      "desktop": {
        "paddingTop": "20px",
        "paddingBottom": "20px",
        "borderBottom": "1px solid #eee"
      }
    },
    "__stylesStates": {}
  },
  "__attributes": {},
  "children": [
    { "type": "template-text", "version": 1, "text": "", "__template": "${item.post_title}", "__settings": {}, "__elementType": "h2", "__css": { "__className": "", "__externalClassNames": "", "__styles": {}, "__stylesStates": {} }, "__attributes": {} },
    { "type": "template-text", "version": 1, "text": "", "__template": "${item.post_excerpt}", "__settings": {}, "__elementType": "p", "__css": { "__className": "", "__externalClassNames": "", "__styles": {}, "__stylesStates": {} }, "__attributes": {} }
  ],
  "direction": null,
  "format": 0,
  "indent": 0
}
```

## Main APIs
- Factory: `$createCollectionElementNode(node?)`
- Type guard: `$isCollectionElementNode(node)`
- `getDataForThisElement()`
- `$findParentCollectionElementNode(node)`
- `$isInCollectionElementNode(node)`
- `$getCollectionElementData(node)`
