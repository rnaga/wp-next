# Heading Node (`type: "heading"`)

## Purpose
Use for heading text with configurable HTML level (`h1`-`h6`) and template text features. Renders as the selected heading tag and supports `${...}` template placeholders for dynamic text. Use `template-text` with `__elementType: "h1"` (etc.) as an alternative when more control over the element type or styling is needed; `heading` is the simpler choice when only the level matters.

## Serialization
Serialized type: `SerializedHeadingNode`

Node-specific field:
- `__level: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"`

## Core Behavior
- Extends `TemplateTextNode`.
- Renders as the selected heading tag.
- Empty when text is blank after trim.
- `updateDOM()` triggers remount when heading level changes.

## Main APIs
- Factory: `$createHeadingNode(node?)`
- Type guard: `$isHeadingNode(node)`
