# Pagination Node (`type: "pagination"`)

## Purpose
Use as a decorator node to render pagination UI linked to a collection node (e.g., a query/data-fetching node). It listens for fetch events and updates the page display reactively.

## Serialization
Serialized type: `SerializedPaginationNode`

Node-specific field:
- `__config: PaginationConfig`

### `PaginationConfig`
```ts
type PaginationConfig = {
  targetCollection?: string;           // Name of the collection/data-fetching node to paginate
  urlType?: "none" | "query" | "segment"; // How the page number is reflected in the URL
  classNames?: PaginationClassNames;   // Optional CSS class overrides
};
```

### `urlType` values
| Value | Behavior |
|-------|----------|
| `"none"` | Does not update the URL (default) |
| `"query"` | Appends `?page=N` to the URL |
| `"segment"` | Appends `/N` as a path segment, replacing any existing page segment |

## CSS Class Names (`PaginationClassNames`)

Each part of the rendered pagination UI can be customized via `classNames` in the config. If a value is omitted, the default class is used.

```ts
type PaginationClassNames = {
  container?: string;  // Wrapping <div>. Default: "pagination-container"
  info?: string;       // <p> showing "Page X of Y (Total: Z items)". Default: "pagination-info"
  controls?: string;   // <div> wrapping buttons. Default: "pagination-controls"
  button?: string;     // All page buttons (prev, next, numbered). Default: "pagination-button"
  ellipsis?: string;   // <span> for "..." separators. Default: "pagination-ellipsis"
};
```

### Additional classes applied automatically
- Active page button gets an extra `active` class: `"pagination-button active"`
- Previous button gets an extra `prev` class: `"pagination-button prev"`
- Next button gets an extra `next` class: `"pagination-button next"`

These modifier classes are always appended after the `button` class name (custom or default).

## Rendered Structure

```html
<div class="pagination-container">
  <p class="pagination-info">Page 2 of 10 (Total: 100 items)</p>
  <div class="pagination-controls">
    <button class="pagination-button prev">Previous</button>
    <button class="pagination-button">1</button>
    <span class="pagination-ellipsis">...</span>
    <button class="pagination-button active" disabled>2</button>
    <button class="pagination-button">3</button>
    <span class="pagination-ellipsis">...</span>
    <button class="pagination-button">10</button>
    <button class="pagination-button next">Next</button>
  </div>
</div>
```

## Page Number Display Logic
- Shows up to 7 pages at once.
- Always shows the first and last page.
- Shows 1 page on each side of the current page.
- Inserts `"..."` ellipsis spans when there are gaps.

## Core Behavior
- Extends `ReactDecoratorNode`.
- `decorate()` returns `<Pagination config={...} />`.
- Considered empty when `targetCollection` is not set (`isEmpty()` returns `true`).
- Listens for `DATA_FETCHING_NODE_FETCHED_COMMAND` to update pagination data when the linked collection fetches new data.
- Also listens for `PAGINATION_UPDATED` hook action for external updates.
- Calls `fetchDataAndUpdateView` on page change, passing the new page number to the linked collection.

## Main APIs
- Factory: `$createPaginationNode(node?)`
- Type guard: `$isPaginationNode(node)`
- `getConfig()` / `setConfig(config: PaginationConfig)` — read or update the node config

## Example JSON
```json
{
  "type": "pagination",
  "version": 1,
  "__config": {
    "targetCollection": "posts",
    "urlType": "query",
    "classNames": {
      "container": "my-pagination",
      "button": "my-btn",
      "ellipsis": "my-ellipsis"
    }
  }
}
```
