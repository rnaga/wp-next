# Collection Node (`type: "collection"`)

## Purpose
Use to define a repeating template region bound to fetched array data. Children are `collection-element` nodes, each representing one item in the data array.

## Serialization
Serialized type: `SerializedCollectionNode` (extends `SerializedWPElementNode`)

Node-specific fields:
- `__name: string` — unique collection name, default `"collection-{random9chars}"`
- `__dataNodeNameDotField: string` — reference to a `DataFetchingNode` and optional field path (default `""`)
- `__itemName: string` — variable name for the current item inside templates (default `"item"`)
- `__elementMaxLength: number` — max number of collection-element instances to render (default `2`)

Inherited from `WPElementNode`:
- `__css` — style object (see styles.md)
- `__attributes` — HTML attributes
- `__dynamicAttributes` — conditional attribute rules (optional)

Inherited from Lexical `ElementNode`:
- `children`, `direction`, `format`, `indent`, `version`

## `__dataNodeNameDotField` Format

Format: `"<dataFetchingNodeName>"` or `"<dataFetchingNodeName>.<field>"`

- `"posts"` — uses the root data from a `DataFetchingNode` named `"posts"` as the array
- `"posts.items"` — reads the `.items` field from a node named `"posts"`

Resolution at runtime:
```
const [name, field] = dataNodeNameDotField.split(".");
let cachedData = $getFetchedData(name);
const nodeData = !field ? cachedData : cachedData?.[field];
// nodeData must be Array<any>
```

## `__elementMaxLength` Behavior

- Caps the number of rendered `CollectionElementNode` children
- Actual render count: `Math.min(fetchedData.length, __elementMaxLength)`
- If no data is available, renders exactly `__elementMaxLength` elements as placeholders

## Children Structure

Only the **first** `CollectionElementNode` (the template) is saved in JSON. At runtime, `$syncCollectionElementNodesInCollection` clones it to produce `elementMaxLength` instances, each populated with index-specific data via `refreshNodes()`.

## JSON Example

```json
{
  "type": "collection",
  "version": 1,
  "__name": "collection-abc123def",
  "__dataNodeNameDotField": "posts",
  "__itemName": "item",
  "__elementMaxLength": 3,
  "__css": {
    "__className": "",
    "__externalClassNames": "",
    "__styles": {
      "desktop": {
        "display": "grid",
        "gridTemplateColumns": "repeat(3, 1fr)",
        "gap": "20px"
      }
    },
    "__stylesStates": {}
  },
  "__attributes": {},
  "children": [
    {
      "type": "collection-element",
      "__isCollectionElement": true,
      "__css": { "__className": "", "__externalClassNames": "", "__styles": {}, "__stylesStates": {} },
      "__attributes": {},
      "children": [
        {
          "type": "template-text",
          "version": 1,
          "text": "",
          "__template": "${item.post_title}",
          "__settings": {},
          "__elementType": "h2",
          "__css": { "__className": "", "__externalClassNames": "", "__styles": {}, "__stylesStates": {} },
          "__attributes": {}
        }
      ],
      "direction": null,
      "format": 0,
      "indent": 0
    }
  ],
  "direction": null,
  "format": 0,
  "indent": 0
}
```

## Main APIs
- Factory: `$createCollectionNode(node?)`
- Type guard: `$isCollectionNode(node)`
- `$getCollectionElementLength(collectionNode)`
- `$syncCollectionElementNodesInCollection(collectionNode, child?, options?)`
- `$syncParentCollections(node, options?)`
