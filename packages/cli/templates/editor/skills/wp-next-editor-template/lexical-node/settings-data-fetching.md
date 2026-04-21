# Settings Data Fetching Node (`type: "settings-data"`)

## Purpose

Fetches global WordPress site settings (title, URL, timezone, etc.). Placed as a direct child of root. Use in templates that display site-wide information such as the site name, tagline, or home URL.

## Serialization

Inherits `SerializedDataFetchingNode`. No additional serialized fields. See [data-fetching.md](data-fetching.md) for the base shape.

## Query Format

No query parameters. `ALLOWED_QUERY_PASSTHROUGH_KEYS = []`.

## Fetched Data Shape (validated by Zod)

```typescript
{
  title?: string;                              // site title
  description?: string;                        // site tagline
  url?: string;                                // WordPress address (URL)
  home?: string;                               // site address (URL)
  email?: string;                              // admin email
  timezone?: string;                           // timezone string
  date_format?: string;
  time_format?: string;
  start_of_week?: number;
  use_smilies?: number;
  default_category?: number;
  default_post_format?: number;
  posts_per_page?: number;
  show_on_front?: string;                      // "page" | "posts"
  page_on_front?: number;
  page_for_posts?: number;
  default_ping_status?: "open" | "closed";
  default_comment_status?: "open" | "closed";
  site_icon?: number;
  time_offset_minutes?: number;
}
```

## JSON Example

```json
{
  "type": "settings-data",
  "version": 1,
  "name": "settings",
  "ID": 55021,
  "query": {},
  "options": {},
  "allowedQueryPassthroughKeys": []
}
```

## Template Text Usage

```
${settings.title}        → site title
${settings.description}  → site tagline
${settings.url}          → WordPress address
${settings.home}         → site home URL
${settings.email}        → admin email
```

Where `"settings"` matches the `name` field of this node.

## Main APIs

- Factory: `$createSettingsDataFetchingNode()`
- Type guard: `$isSettingsDataFetchingNode(node)`
