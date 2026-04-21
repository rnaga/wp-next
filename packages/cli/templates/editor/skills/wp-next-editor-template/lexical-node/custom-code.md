# Custom Code Node (`type: "custom-code"`)

## Purpose

Manages custom code snippet slugs to be injected into the page `<head>` or `<footer>`. Placed as a direct child of root. Does not render visible UI. Each slug references an external code snippet registered in the system; this node tracks which slugs are active for header and footer injection.

## Serialization

```json
{
  "type": "custom-code",
  "version": 1,
  "__slugs": {
    "header": ["my-analytics-snippet", "consent-banner"],
    "footer": ["chat-widget"]
  }
}
```

### Fields

- `__slugs: { header: string[]; footer: string[] }` — lists of code snippet slugs per injection location. Default: `{ header: [], footer: [] }`.

## Migration

Legacy format where `__slugs` was a flat `string[]` (header-only) is automatically migrated to the new `{ header, footer }` shape on `importJSON`.

## Main APIs

- `$createCustomCodeNode(node?)` — factory
- `$isCustomCodeNode(node)` — type guard
- `$getCustomCodeNode()` — find the single instance in root children
- `updateCustomCodeSlugs(editor, location, slugs)` — replace slug list for a location
- `appendCustomCodeSlug(editor, location, slug)` — add a slug (deduped)
- `mergeCustomCodeSlugs(base, incoming)` — merge two slug lists, preserving base order and inserting new items before their nearest shared anchor

## Notes

- At most one `CustomCodeNode` should exist per page.
- An empty node (`isEmpty() === true`) means no custom code is injected.
