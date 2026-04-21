# Post Data Fetching Node (`type: "post-data"`)

## Purpose
Use to fetch and cache a single public post by `ID` or `slug` (with optional `postType`).

## Serialization
Inherits `SerializedDataFetchingNode`. No additional serialized fields.

## Query Format

```typescript
{
  ID: number;            // WordPress post ID
  slug?: string;         // post slug (takes priority over ID if both present)
  postType?: PostType;   // e.g. "post", "page", or custom post type
}
```

**Note:** `slug` takes priority over `ID` when both are present.

## Allowed Query Passthrough Keys

```typescript
["ID", "slug"]
```

`postType` is NOT passthrough-able — it cannot be overridden from URL params.

## Fetched Data Shape (validated by Zod)

```typescript
{
  ID?: number;
  post_title?: string;
  post_content?: string;
  comment_count?: number;
  comment_status?: string;
  guid?: string;
  post_author?: number;
  author?: { ID: number; user_nicename: string; display_name: string };
  post_excerpt?: string;
  post_date?: Date;        // coerced from string
  post_modified?: Date;    // coerced from string
  post_name?: string;      // the slug
  post_password?: string;
  post_type?: string;
  post_status?: string;
  categories?: Array<{ term_id: number; name: string; slug: string }>;
  tags?: Array<{ term_id: number; name: string; slug: string }>;
}
```

## JSON Example

```json
{
  "type": "post-data",
  "version": 1,
  "name": "post",
  "ID": 42731,
  "query": {
    "ID": 123,
    "postType": "post"
  },
  "options": {},
  "allowedQueryPassthroughKeys": ["ID", "slug"]
}
```

## Template Text Usage

Once fetched, data fields are accessible in `template-text` nodes:

```
${post.post_title}        → post title
${post.post_excerpt}      → post excerpt
${post.author.display_name} → author name
${post.post_date}         → publish date
```

Where `"post"` matches the `name` field of this data-fetching node.

## Main APIs
- Factory: `$createPostDataFetchingNode()`
- Type guard: `$isPostDataFetchingNode(node)`
- Constant: `ALLOWED_QUERY_PASSTHROUGH_KEYS`
