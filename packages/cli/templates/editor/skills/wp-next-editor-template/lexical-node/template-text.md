# Template Text Node (`type: "template-text"`)

## Purpose
Use for text nodes that resolve `${...}` placeholders from data-fetching nodes, collection context, or explicitly passed data. Renders as a configurable HTML element.

## Serialization
Serialized type: `SerializedTemplateTextNode` (extends `SerializedWPTextNode`)

Node-specific fields:
- `__template: string` — the raw template string with `${...}` placeholders (default `""`)
- `__settings: Record<string, any>` — arbitrary key-value metadata; values can also contain `${...}` placeholders (default `{}`)
- `__elementType: string` — HTML tag for DOM rendering (default `"div"`)

Inherited from `WPTextNode`:
- `__css` — style object (see styles.md)
- `__attributes` — HTML attributes
- `__dynamicAttributes` — conditional attribute rules (optional)

Inherited from Lexical `TextNode`:
- `text` — always exported as `""` (runtime text is not persisted)
- `format`, `detail`, `mode`, `style`

## Template Syntax

Placeholders use the format: `${name.key1.key2...}`

- First segment (`name`) is the **data source name**
- Remaining segments are nested key accessors
- Examples: `${post.post_title}`, `${item.author.display_name}`, `${post.categories.0.name}`

## Variable Resolution Order

`$processTemplateText` resolves each `${name.key1...}` placeholder in this priority:

1. **Explicit data** — `options.data[name]` passed at call time (e.g. from `loadText({ data })`)
2. **Collection element context** — if the node is inside a `collection-element`, inherits `getDataForThisElement()[name]`
3. **Root DataFetchingNode** — scans `$getRoot().getChildren()` for a `DataFetchingNode` where `getName() === name`
4. **Global fetched data registry** — `$getFetchedData(name)` cache lookup

## `__elementType` Valid Values

The element type determines the HTML container tag. Tags are split into two groups based on their HTML content model.

### Flow-content tags (safe for any template content)
These can contain block-level elements, so they are safe even when a template resolves to HTML that includes `<p>`, `<div>`, etc.:

```
"address", "article", "aside", "blockquote",
"div",
"footer", "header",
"main",
"section"
```

### Phrasing-content-only tags (plain-text templates only)
These tags auto-close when the browser encounters a block-level element inside them, causing children to escape the container. Only use them when the template resolves to plain text (never raw HTML with block elements):

```
"h1", "h2", "h3", "h4", "h5", "h6"   ← headings (post titles, section labels)
```

> **Do not use `p`, `summary`, or other phrasing-content-only tags** as `__elementType`. `<p>` is the most common offender: `<p><p>...</p></p>` is invalid HTML and browsers immediately close the outer `<p>`, causing the inner content to escape the element entirely.

Default: `"div"`

## `__settings` Usage

`__settings` is a free-form `Record<string, any>`. Values can themselves be template strings. When read via `$getTemplateTextSettings()`, each value is passed through `$processTemplateText()`:

```typescript
// Example: settings with template values
{ "linkHref": "/posts/${item.post_name}", "ariaLabel": "${item.post_title}" }
```

## JSON Example

```json
{
  "type": "template-text",
  "version": 1,
  "text": "",
  "__template": "${post.post_title}",
  "__settings": {},
  "__elementType": "h1",
  "__css": {
    "__className": "",
    "__externalClassNames": "",
    "__styles": {
      "desktop": {
        "fontSize": "32px",
        "fontWeight": "700",
        "color": "#1a1a1a"
      },
      "mobile": {
        "fontSize": "24px"
      }
    },
    "__stylesStates": {}
  },
  "__attributes": {},
  "format": 0,
  "detail": 0,
  "mode": "normal",
  "style": ""
}
```

## Main APIs
- Factory: `$createTemplateTextNode(node?)`
- Type guard: `$isTemplateTextNode(node)`
- `$processTemplateText(template, { data?, node })`
- `$getTemplateTextSettings(node, options)`
- `$loadTemplateText(node)`
