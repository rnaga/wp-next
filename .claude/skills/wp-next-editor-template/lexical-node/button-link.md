# Button Link Node (`type: "button-link"`)

## Purpose
Use as a button-style link with templated `href` and `label` values. Unlike `link` (which is a container that wraps child nodes), `button-link` is a self-contained leaf node that renders as a `<button>` element with an inline `onclick` that navigates to the resolved href. Use it when a clickable button with dynamic label text is needed, especially inside collection templates.

## Serialization
Serialized type: `SerializedButtonLinkNode`

Node-specific fields:
- `__href: string`
- `__label: string`
- `__target: "_blank" | "_self" | "_parent" | "_top"`

## Core Behavior
- Extends `TemplateTextNode`.
- Maintains runtime-resolved values `__processedHref` and `__processedLabel`.
- Renders as `<button>` and sets inline `onclick` code that opens target URL.
- `loadLink({ data })` resolves template placeholders in both href and label.
- Not treated as empty (`isEmpty()` returns `false`).

## Main APIs
- Factory: `$createButtonLinkNode(node?)`
- Type guard: `$isButtonLinkNode(node)`
- `loadLink(options?)`
