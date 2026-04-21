# Image Node (`type: "image"`)

## Purpose
Use for image rendering with template-driven URLs. Inherits text/template processing behavior from `TemplateTextNode`.

## Serialization
Serialized type: `SerializedImageNode`

Node-specific fields:
- `__settings.url: string` — the image URL (source of truth; may contain template expressions)
- `__url: string` — the resolved URL after `loadText()` processes `__settings.url`

**Both `__settings` and `__url` must be set when defining an image node in JSON.** `__settings.url` drives the URL; `__url` holds the pre-resolved value used at render time.

Exported JSON includes:
```json
{
  "type": "image",
  "version": 1,
  "__settings": {
    "url": "https://example.com/image.jpg"
  },
  "__url": "https://example.com/image.jpg"
}
```
Plus inherited `TemplateTextNode` serialization fields (`__css`, `__attributes`, `__dynamicAttributes`, `__template`, `__elementType`).

Full example:
```json
{
  "detail": 0,
  "format": 0,
  "mode": "normal",
  "style": "",
  "text": "",
  "type": "image",
  "version": 1,
  "__css": {
    "__className": "pioffi01",
    "__externalClassNames": "",
    "__styles": {
      "desktop": {
        "width": "100%",
        "height": "150px",
        "objectFit": "fill"
      }
    },
    "__stylesStates": {},
    "__classNameEditor": "__editor_gq1onc",
    "__stylesEditor": {
      "backgroundColor": "none"
    }
  },
  "__attributes": {},
  "__dynamicAttributes": {
    "__rules": []
  },
  "__template": "",
  "__settings": {
    "url": "https://picsum.photos/seed/fill/400/300"
  },
  "__elementType": "div",
  "__url": "https://picsum.photos/seed/fill/400/300"
}
```

## Core Behavior
- Extends `TemplateTextNode`.
- `loadText(options)` reads `__settings.url`, processes it through `$processTemplateText(...)`, and stores the result in `__url`.
- `setMediaDOM(element)` renders a non-draggable `<img>`:
  - `width: 100%`, `height: auto`
  - `src` and `alt` set from resolved `__url`
- `isEmpty()` is true when `__url` is empty.
- Empty state:
  - `__heightWhenEmpty = 200`
  - `getEmptyText()` returns `"Image URL is empty"`
  - `initEmptyDOM()` sets default padding + fixed width/height (`200px`).

## Main APIs
- `getUrl()`
- Factory: `$createImageNode(node?)`
- Type guard: `$isImageNode(node)`
- Clone/import/export preserve inherited template text fields plus `__url`.
