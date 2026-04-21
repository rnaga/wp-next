# Video Node (`type: "video"`)

## Purpose
Use for video rendering from a template-resolved URL.

## Serialization
Serialized type: `SerializedVideoNode`

Node-specific field:
- `__url: string`

## Core Behavior
- Extends `TemplateTextNode`.
- `loadText()` resolves `settings.url` into `__url`.
- Renders a `<video controls>` element with non-draggable behavior.
- Empty when URL is missing; empty text is `"Video URL is empty"`.

## Main APIs
- `getUrl()`
- Factory: `$createVideoNode(node?)`
- Type guard: `$isVideoNode(node)`
