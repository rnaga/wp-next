# Custom Font Node (`type: "customfonts-data"`)

## Purpose
Use as hidden data-fetching node for custom font definitions, `@font-face` CSS, and slug synchronization from node usage.

## Serialization
Inherits `SerializedDataFetchingNode` from `DataFetchingNode`.

## Core Behavior
- Extends `DataFetchingNode<{ slugs: string[] }, Data>`.
- Hidden in UI (`__hidden = true`).
- Static name enforced as `custom-fonts-data-fetching`.
- Query deduplicates slugs.
- `fetch(...)` loads font metadata and generated font-face CSS from server actions.
- Helpers add/remove/sync slugs and refresh fetched data cache.

## Main APIs
- Factory: `$createCustomFontNode()`
- Type guard: `$isCustomFontNode(node)`
- `$getCustomFontNode()`
- `fetchCustomFontNode(editor)`
- `addCustomFont(editor, slugs)`
- `removeCustomFont(editor, slugs)`
- `$syncCustomFont(editor)`
