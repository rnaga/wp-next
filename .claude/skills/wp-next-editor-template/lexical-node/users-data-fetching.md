# Users Data Fetching Node (`type: "users-data"`)

## Purpose

Fetches a list of WordPress users. Placed as a direct child of root. Use in templates that display an author list, contributor page, or any user directory.

## Serialization

Inherits `SerializedDataFetchingNode`. No additional serialized fields. See [data-fetching.md](data-fetching.md) for the base shape.

## Query Format

```typescript
{
  search?: string;
  post?: number;                     // filter by post author
  slug?: string[];
  roles?: string[];
  has_published_posts?: boolean;
  exclude_anonymous?: boolean;
  include?: number[];                // include specific user IDs
  include_unregistered_users?: boolean;
  per_page?: number;
  page?: number;
  order?: "asc" | "desc";
  orderby?: string;
}
```

## Allowed Query Passthrough Keys

```typescript
["search", "post", "slug", "roles", "has_published_posts", "exclude_anonymous", "include", "include_unregistered_users", "per_page", "page", "order", "orderby"]
```

## Fetched Data Shape (validated by Zod)

Returns an array of user objects:

```typescript
Array<{
  ID: number;
  user_nicename: string;   // URL-friendly username (max 50 chars)
  user_email: string;      // email address (max 100 chars)
  user_url: string;        // website URL (max 100 chars)
  display_name: string;    // public display name (max 250 chars)
}>
```

## JSON Example

```json
{
  "type": "users-data",
  "version": 1,
  "name": "authors",
  "ID": 41890,
  "query": {
    "has_published_posts": true,
    "per_page": 10,
    "orderby": "name"
  },
  "options": {},
  "allowedQueryPassthroughKeys": ["search", "post", "slug", "roles", "has_published_posts", "exclude_anonymous", "include", "include_unregistered_users", "per_page", "page", "order", "orderby"]
}
```

## Template Text Usage

Used with a `collection` node referencing this node by name:

```
${authors.display_name}    → user's display name
${authors.user_nicename}   → URL-friendly username
${authors.user_email}      → email address
${authors.user_url}        → website URL
```

## Main APIs

- Factory: `$createUsersDataFetchingNode()`
- Type guard: `$isUsersDataFetchingNode(node)`
