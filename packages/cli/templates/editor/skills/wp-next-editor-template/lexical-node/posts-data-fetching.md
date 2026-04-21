# Posts Data Fetching Node (`type: "posts-data"`)

## Purpose
Use to fetch and cache a post list with optional pagination metadata. Typically used with a `collection` node to render repeated post items.

## Serialization
Inherits `SerializedDataFetchingNode`. No additional serialized fields.

## Query Format

```typescript
{
  search?: string;       // full-text search string
  categories?: any;      // category filter (ID or IDs)
  tags?: any;            // tag filter
  author?: number;       // author ID filter
  per_page?: number;     // items per page
  page?: number;         // page number
  order?: "asc" | "desc";  // sort direction
  orderby?: string;      // sort field: "date", "title", "id", etc.
  postType?: PostType;   // e.g. "post", "page", or custom (NOT passthrough-able)
}
```

## Allowed Query Passthrough Keys

```typescript
["search", "categories", "tags", "author", "per_page", "page", "order", "orderby"]
```

`postType` is excluded — it cannot be overridden from URL params.

## Fetched Data Shape

Returns an array of post objects, each validated with the same schema as `post-data`:

```typescript
Array<{
  ID?: number;
  post_title?: string;
  post_content?: string;
  post_excerpt?: string;
  post_date?: Date;
  post_modified?: Date;
  post_name?: string;
  post_type?: string;
  post_status?: string;
  post_author?: number;
  author?: { ID: number; user_nicename: string; display_name: string };
  categories?: Array<{ term_id: number; name: string; slug: string }>;
  tags?: Array<{ term_id: number; name: string; slug: string }>;
  // ... same fields as post-data
}>
```

## Pagination Shape

```typescript
{
  page: number;
  limit: number;
  totalPage: number;
  count: number;
}
```

## JSON Example

```json
{
  "type": "posts-data",
  "version": 1,
  "name": "posts",
  "ID": 87234,
  "query": {
    "per_page": 10,
    "page": 1,
    "order": "desc",
    "orderby": "date",
    "postType": "post"
  },
  "options": {},
  "allowedQueryPassthroughKeys": ["search", "categories", "tags", "author", "per_page", "page", "order", "orderby"]
}
```

## Typical Usage with Collection

A `posts-data` node named `"posts"` pairs with a `collection` node:

```json
// Root children include:
{ "type": "posts-data", "name": "posts", "query": { "per_page": 6, "orderby": "date" }, ... }

// Collection references it:
{ "type": "collection", "__dataNodeNameDotField": "posts", "__itemName": "item", "__elementMaxLength": 6, ... }

// Template text inside collection-element uses:
// ${item.post_title}, ${item.post_excerpt}, ${item.author.display_name}
```

## Main APIs
- Factory: `$createPostsDataFetchingNode()`
- Type guard: `$isPostsDataFetchingNode(node)`
- Constant: `ALLOWED_QUERY_PASSTHROUGH_KEYS`
