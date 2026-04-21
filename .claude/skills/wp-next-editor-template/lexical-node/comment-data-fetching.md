# Comment Data Fetching Node (`type: "comment-data"`)

## Purpose

Fetches a single WordPress comment by `ID`. Placed as a direct child of root. Use in templates that display a single comment detail.

## Serialization

Inherits `SerializedDataFetchingNode`. No additional serialized fields. See [data-fetching.md](data-fetching.md) for the base shape.

## Query Format

```typescript
{
  ID: number; // WordPress comment ID (required)
}
```

## Allowed Query Passthrough Keys

```typescript
["ID"]
```

## Fetched Data Shape (validated by Zod)

```typescript
{
  comment_ID: number;
  comment_post_ID: number;
  comment_author: string;
  comment_author_email: string;
  comment_date: string;
  comment_date_gmt: string;
  comment_content: string;
  comment_parent: number;
  comment_approved: string;
  comment_type: string;
  user_id: number;
  count_children: number;
  post_comment_count?: number;
  post_title?: string;
  post_type?: string;
  post_guid?: string;
  post_author?: number;
  post_status?: string;
  parent_comment_author?: string;
  parent_user_id?: number;
  parent_user_display_name?: string;
  user_display_name?: string;
  children?: unknown[];
}
```

## JSON Example

```json
{
  "type": "comment-data",
  "version": 1,
  "name": "comment",
  "ID": 12345,
  "query": {
    "ID": 42
  },
  "options": {},
  "allowedQueryPassthroughKeys": ["ID"]
}
```

## Template Text Usage

```
${comment.comment_author}      → comment author name
${comment.comment_content}     → comment body
${comment.comment_date}        → comment date string
${comment.post_title}          → title of the associated post
```

Where `"comment"` matches the `name` field of this node.

## Main APIs

- Factory: `$createCommentDataFetchingNode()`
- Type guard: `$isCommentDataFetchingNode(node)`
