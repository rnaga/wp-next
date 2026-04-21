# Custom Properties Style Usage

Use `__customProperties` as an escape hatch when a CSS property value is too complex to express through the style core's structured keys.

## When to use

The style core provides structured keys for most properties (`%transform`, `__transition`, `__border`, etc.). Use `__customProperties` when those structured forms are insufficient — for example:

- A `transform` with a value the `%transform` object model cannot represent (e.g., `matrix3d(...)`, a chained multi-function string like `translateX(50%) rotate(45deg) scale(1.2)`)
- A `transition` with multiple targets, mixed timing functions, or delay combos that exceed what `__transition` entries can express (e.g., `transform 0.4s ease, opacity 0.2s linear 0.1s`)
- Any CSS property that has no corresponding style form control (e.g., `clip-path`, `filter`, `will-change`, `perspective`, `backdrop-filter`)

## Override behavior

Custom properties are applied **after** all other form-controlled properties. They overwrite any key that the style form already set. This means you can use `__customProperties` to override a specific property (e.g., replace the `transition` the form generated) without removing the rest of the style.

## Keys in style payload

- `__customProperties` — encoded payload (base64 JSON); see encoding rules below

## Encoding

The payload is `base64(JSON.stringify(properties))` where `properties` is a flat `Record<string, string>` of CSS property names (kebab-case or camelCase) to raw CSS values.

```ts
// Pseudocode — produces the __customProperties string value
encodeCustomProperties({
  "transform": "translateX(50%) rotate(45deg) scale(1.2)",
  "transition": "transform 0.4s ease, opacity 0.2s linear 0.1s",
})
```

When generating templates programmatically, encode the properties object to base64 JSON and assign the result string to `__customProperties`.

## Example — complex transform

```json
{
  "__customProperties": "<base64 of {\"transform\":\"translateX(50%) rotate(45deg) scale(1.2)\"}>"
}
```

Decoded payload:
```json
{
  "transform": "translateX(50%) rotate(45deg) scale(1.2)"
}
```

## Example — complex transition

```json
{
  "__customProperties": "<base64 of {\"transition\":\"transform 0.4s ease, opacity 0.2s linear 0.1s\"}>"
}
```

Decoded payload:
```json
{
  "transition": "transform 0.4s ease, opacity 0.2s linear 0.1s"
}
```

## Example — multiple overrides at once

Custom properties can carry multiple CSS properties in one payload. All entries are merged into the output CSS and override any same-named properties set by the style form.

Decoded payload:
```json
{
  "transform": "matrix3d(1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1)",
  "transition": "transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
  "will-change": "transform"
}
```
