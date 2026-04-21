# __backgroundGlobal

Use `__backgroundGlobal` for helper values shared across background layers.

## Feature descriptions

- Stores global color/clip helpers used with layered backgrounds.
- These values are appended to the final `background` output semantics.
- Keep this synchronized with the derived `background` field.

## Supported fields

- `$backgroundColor`: background color token/value
- `$clip`: `border-box` | `padding-box` | `content-box` | `text` | `border-area`

## Example

```json
{
  "__backgroundGlobal": {
    "$backgroundColor": "#ffffff",
    "$clip": "padding-box"
  }
}
```
