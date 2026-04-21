# Search Box Node (`type: "searchbox"`)

## Purpose
Use as a decorator node that renders a search input UI targeting a specific collection node. When the user submits a search query, the node triggers the linked collection to re-fetch with the new search term applied. Supports optional dropdown configuration and URL-based search parameter reflection.

## Serialization
Serialized type: `SerializedSearchBoxNode`

Node-specific field:
- `__config` with fields like `targetCollection`, `urlType`, `placeholder`, and optional `dropdown` config.

## Core Behavior
- Extends `ReactDecoratorNode`.
- `decorate()` returns `<SearchBox config={...} />`.
- Empty when `targetCollection` is not set.

## Main APIs
- Factory: `$createSearchBoxNode(node?)`
- Type guard: `$isSearchBoxNode(node)`
