# Comments Data Fetching Node (`type: "comments-data"`)

## Purpose

Fetches a list of WordPress comments. Placed as a direct child of root. Use in templates that display a comment list (e.g. a post's comment thread). Always fetches with `status: "approve"` — this default is hardcoded and cannot be overridden via query passthrough.

## Serialization

Inherits `SerializedDataFetchingNode`. No additional serialized fields. See [data-fetching.md](data-fetching.md) for the base shape.

## Query Format

```typescript
{
  search?: string;
  post?: number;        // filter by post ID
  post_slug?: string;
  author?: number;
  status?: string;      // NOTE: overridden to "approve" at fetch time
  parent?: number;
  per_page?: number;
  page?: number;
  order?: "asc" | "desc";
  orderby?: string;
}
```

## Allowed Query Passthrough Keys

```typescript
["search", "post", "post_slug", "author", "status", "parent", "per_page", "page", "order", "orderby"]
```

## Fetched Data Shape (validated by Zod)

Returns an array of comment objects:

```typescript
Array<{
  comment_ID?: number;
  comment_post_ID?: number;
  comment_author?: string;
  comment_author_url?: string;
  comment_date?: Date;          // coerced from string
  comment_date_gmt?: Date;      // coerced from string
  comment_content?: string;
  comment_approved?: string;
  comment_parent?: number;
  user_id?: number;
  author?: { ID: number; user_nicename: string; display_name: string };
  post?: { ID: number; post_title: string; post_name: string };
  children?: CommentData[];     // nested replies (recursive)
}>
```

## JSON Example

```json
{
  "type": "comments-data",
  "version": 1,
  "name": "comments",
  "ID": 77412,
  "query": {
    "post": 123,
    "per_page": 10
  },
  "options": {},
  "allowedQueryPassthroughKeys": ["search", "post", "post_slug", "author", "status", "parent", "per_page", "page", "order", "orderby"]
}
```

## Template Text Usage

Used with a `collection` node referencing this node by name:

```
${comments.comment_author}     → commenter name
${comments.comment_content}    → comment body
${comments.comment_date}       → comment date
${comments.author.display_name} → author display name
```

## Main APIs

- Factory: `$createCommentsDataFetchingNode()`
- Type guard: `$isCommentsDataFetchingNode(node)`
