# Form Label Node (`type: "form-label"`)

## Purpose
Use to render a real `<label>` element. This is the correct node for HTML labels that link to form inputs via the `for` attribute. Unlike `template-text` (which does not support `label` as an `__elementType`), `form-label` creates a native `<label>` element. Typical uses: labelling form fields, DaisyUI drawer/toggle triggers.

## Serialization
Serialized type: `SerializedLabelNode` (`Spread<{ __text: string }, SerializedWPTextNode>`)

Node-specific field:
- `__text: string` — the visible text content of the label (default `"Label"`)

Inherits base `WPTextNode` fields: `__css`, `__attributes`, `__dynamicAttributes`, `text`, `format`, `detail`, `mode`, `style`.

## Core Behavior
- Extends `WPTextNode`.
- `initDOM()` creates a `<label>` element and sets `textContent` to `__text`.
- `isEmpty()` always returns `false`.
- Use `for` in `__attributes` to associate the label with an input's `id`.
- `__attributes` are applied to the DOM element via `attachAttributesInDOM` — `for`, `aria-label`, and any other HTML attributes work.

## JSON Example

```json
{
  "type": "form-label",
  "version": 1,
  "__text": "☰",
  "__css": {
    "__className": "p1a2b3c",
    "__externalClassNames": "btn btn-square btn-ghost",
    "__styles": {},
    "__stylesStates": {}
  },
  "__attributes": {
    "for": "my-drawer"
  },
  "__dynamicAttributes": {},
  "text": "",
  "format": 0,
  "detail": 0,
  "mode": "normal",
  "style": ""
}
```

## Main APIs
- Factory: `$createLabelNode(node?)`
- Type guard: `$isLabelNode(node)`
- `getLabel()` — returns `__text`
- `setLabel(text)` — sets `__text`
