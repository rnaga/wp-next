# Terms Data Fetching Node (`type: "terms-data"`)

## Purpose

Fetches a list of WordPress taxonomy terms (categories, tags, or any custom taxonomy). Placed as a direct child of root. Use in templates that display term lists such as a category archive sidebar or a tag cloud.

## Serialization

Inherits `SerializedDataFetchingNode`. No additional serialized fields. See [data-fetching.md](data-fetching.md) for the base shape.

## Query Format

```typescript
{
  taxonomy: string;   // required — e.g. "category", "post_tag", or custom taxonomy slug
  page?: number;
  per_page?: number;
  search?: string;
  exclude?: number[];
  include?: number[];
  order?: "asc" | "desc";
  orderby?: string;
  post?: number;      // filter terms assigned to a specific post
  slug?: string[];
}
```

`taxonomy` is **required** and is extracted from the query at fetch time. It is not URL-passthrough-able.

## Allowed Query Passthrough Keys

```typescript
["page", "per_page", "search", "exclude", "include", "order", "orderby", "post", "slug"]
```

## Fetched Data Shape (validated by Zod)

Returns an array of term objects:

```typescript
Array<{
  term_id: number;
  count: number;       // number of posts with this term
  description: string;
  name: string;
  slug: string;
  parent: number;      // parent term ID (0 = top-level)
  taxonomy: string;
}>
```

## JSON Example

```json
{
  "type": "terms-data",
  "version": 1,
  "name": "categories",
  "ID": 63108,
  "query": {
    "taxonomy": "category",
    "per_page": 20,
    "orderby": "count",
    "order": "desc"
  },
  "options": {},
  "allowedQueryPassthroughKeys": ["page", "per_page", "search", "exclude", "include", "order", "orderby", "post", "slug"]
}
```

## Template Text Usage

Used with a `collection` node referencing this node by name:

```
${categories.name}        → term name
${categories.slug}        → term slug
${categories.count}       → number of posts
${categories.description} → term description
```

## Main APIs

- Factory: `$createTermsDataFetchingNode()`
- Type guard: `$isTermsDataFetchingNode(node)`
