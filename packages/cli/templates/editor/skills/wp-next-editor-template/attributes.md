# Attributes (`__attributes`)

Every `WPElementNode` and `WPTextNode` carries an `__attributes` field that maps directly to HTML attributes applied to the rendered DOM element.

## JSON Shape

```json
"__attributes": {
  "data-id": "123",
  "aria-label": "My section",
  "data-custom": "value"
}
```

- Keys are HTML attribute names (strings).
- Values are strings (or values that will be coerced to strings on the DOM).
- An empty object `{}` means no extra attributes are set (this is the default).

## Reserved Keys

The following attribute names are **blocked** and cannot be set via `__attributes`. They are managed by other parts of the system:

| Key | Reason |
|-----|--------|
| `__lexical__node_key__` | Internal Lexical node tracking |
| `style` | Managed by the CSS system (`__css`) |
| `class` / `className` | Managed by the CSS system |
| `type` | Set via the InputType selector (for `<input>` elements) |
| `placeholder` | Set via the InputAttributes form |

## Scope

- Available on all nodes that extend `WPElementNode` or `WPTextNode`.
- Not available on `WPDecoratorNode` instances.
- Attributes are static — they are always applied to the DOM, regardless of any runtime condition. For conditional attribute application, use `__dynamicAttributes` instead.

## Serialization

During `exportJSON`, `__attributes` is serialized as-is. During `importJSON`, the base `importJSON()` method reads it back and restores all key-value pairs.

## Examples

### Adding a `data-*` attribute for targeting

```json
"__attributes": {
  "data-section": "hero"
}
```

### Setting ARIA attributes for accessibility

```json
"__attributes": {
  "aria-label": "Main navigation",
  "role": "navigation"
}
```

### Multiple attributes on a node

```json
{
  "type": "wrapper",
  "version": 1,
  "direction": null,
  "format": "",
  "indent": 0,
  "children": [],
  "__css": { "__className": "p1a2b3c", "__externalClassNames": "", "__styles": {}, "__stylesStates": {} },
  "__attributes": {
    "data-id": "hero-section",
    "aria-label": "Hero",
    "data-testid": "hero"
  },
  "__dynamicAttributes": {}
}
```

## Notes

- Do not set `style`, `class`, or other reserved keys here — use `__css` for those.
- Attribute values are always serialized as strings in JSON. There is no type coercion on import.
- `__attributes` and `__dynamicAttributes.settings.customAttributes` are independent. Static attributes from `__attributes` are always present; dynamic custom attributes from rules are applied only when their conditions are met.
