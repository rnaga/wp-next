# __customProperties

Use `__customProperties` as an escape hatch for any CSS property that cannot be expressed through the form's structured keys.

## Feature descriptions

- Payload is a base64-encoded JSON object mapping CSS property names to values.
- Decoded values are merged into the final CSS output **after** all other form-controlled properties, overwriting same-named keys.
- Accepts base64-encoded JSON (primary format) or the `$value`-wrapper format used by the editor UI.

## When to use

Use `__customProperties` when structured keys are insufficient — for example:
- Complex `transform` values (`matrix3d(...)`, multi-function chains)
- `clip-path`, `filter`, `will-change`, `backdrop-filter`, or other properties with no form control
- Multiple simultaneous overrides

The structured keys (`%transform`, `__transition`, `__border`, etc.) should always be preferred when they can represent the value. `__customProperties` is a last resort.

## Encoding

The payload is `base64(JSON.stringify(properties))` where `properties` is a flat `Record<string, string>` of CSS property names to raw CSS values.

```ts
// Pseudocode — produces the __customProperties string value
encodeCustomProperties({
  "clip-path": "polygon(0 0, 100% 0, 100% 80%, 0 100%)",
  "will-change": "transform",
})
```

## Example

```json
{
  "__customProperties": "<base64 of {\"clip-path\":\"polygon(0 0, 100% 0, 100% 80%, 0 100%)\",\"will-change\":\"transform\"}>"
}
```

Decoded payload:
```json
{
  "clip-path": "polygon(0 0, 100% 0, 100% 80%, 0 100%)",
  "will-change": "transform"
}
```
