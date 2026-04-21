# Embed Node (`type: "embed"`)

## Purpose
Use to store and render raw embed HTML code (e.g. iframes, social media embeds, third-party widgets). The embed code is URI-encoded in the `text` field and decoded at render time via `innerHTML`. Use this when you need to inject arbitrary HTML that cannot be represented with other node types.

## Serialization
Serialized type: `SerializedEmbedNode`

## Core Behavior
- Extends `WPTextNode`.
- Stores embed code in encoded form in `text` (`encodeURIComponent`).
- `getCode()` decodes and `setDOM()` injects with `setInnerHTML(...)`.
- Empty when decoded embed code is empty.
- Empty DOM mode sets default `padding: 20px` and removes it on de-init.

## Main APIs
- `setCode(code)`
- `getCode()`
- Factory: `$createEmbedNode(node?)`
- Type guard: `$isEmbedNode(node)`
