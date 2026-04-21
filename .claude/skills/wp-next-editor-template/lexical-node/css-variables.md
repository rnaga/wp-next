# CSS Variables Node (`type: "cssvariables-data"`)

## Purpose
Use as hidden data-fetching node for CSS variable posts, generated CSS, and font/CSS-variable usage synchronization.

## Serialization
Inherits `SerializedDataFetchingNode` from `DataFetchingNode`.

## Core Behavior
- Extends `DataFetchingNode<{ slugs: string[] }, Data>`.
- Hidden in UI (`__hidden = true`).
- Static name enforced by `setName(...)` as `css-variables-data-fetching`.
- Query deduplicates slugs.
- `fetch(...)` loads CSS variable records and composes CSS text.
- Companion helpers update cached list data, fetch fresh data, and sync usage-driven side effects.

## Main APIs
- Factory: `$createCSSVariablesNode()`
- `$getCSSVariablesNode()`
- `$getCSSVariablesCSS()`
- `fetchCSSVariablesNode(editor)`
- `$updateCSSVariablesListData(editor, cssVariables, contentItem, options?)`
