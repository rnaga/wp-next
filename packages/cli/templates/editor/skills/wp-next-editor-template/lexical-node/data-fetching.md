# Data Fetching Node Base (`type: "*-data"` pattern)

## Purpose
Abstract base for all data-backed nodes (e.g. `post-data`, `posts-data`, custom font data, CSS variables data). Placed as direct children of `$getRoot()`. Does not render visible UI — it is a metadata/data-source node only.

## Serialization
Serialized type: `SerializedDataFetchingNode` (extends `SerializedLexicalNode`)

Fields:
- `name: string` — unique node name used for data lookups (auto-generated default, trimmed)
- `ID: number` — stable identifier (random integer 0–99999)
- `query: any | undefined` — fetch query parameters object (shape depends on subclass)
- `options: Record<string, any> | undefined` — arbitrary key-value options (default `{}`)
- `allowedQueryPassthroughKeys: string[]` — keys permitted to be overridden from URL query params

NOT serialized (runtime only):
- `__data` — fetched data, stored in node and cache
- `__pagination` — pagination metadata (`{ page, limit, totalPage, count }`)
- `__hidden` — hides node from left panel (default `false`)

## How Collections Reference Data Nodes

Collections use `__dataNodeNameDotField` to reference a data-fetching node by its `name` field:
- `"posts"` → finds `DataFetchingNode` where `getName() === "posts"`
- Template text nodes use `${posts.post_title}` to access fields from the fetched data

## URL Query Passthrough

When the page URL contains query parameters matching `allowedQueryPassthroughKeys`, those values override the node's stored query before fetching. Example: `?page=2&search=hello` would override `page` and `search` in a `posts-data` node.

## JSON Example (base shape)

```json
{
  "type": "posts-data",
  "version": 1,
  "name": "posts",
  "ID": 42731,
  "query": {},
  "options": {},
  "allowedQueryPassthroughKeys": []
}
```

## Main APIs
- `$createDataFetchingNode(clazz, args?)`
- `$isDataFetchingNode(node)`
- `$getDataFetchingNodeByName(name)`
- `$storeFetchedData(nodeOrString, data, pagination?)`
- `$getFetchedData(nameOrNode)`
- `fetchDataFetchingNode(node, editor, serverActions, options?)`
