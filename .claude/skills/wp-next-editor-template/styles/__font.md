# __font

Use `__font` to store font metadata used by typography controls.

## Feature descriptions

- Stores source/type metadata for selected fonts.
- Supports Google, custom, and raw/manual font sources.
- Works with direct typography keys such as `fontFamily`, `fontWeight`, and `fontStyle`.

## Supported fields

- `$type`: `google` | `custom` | `raw` | `undefined`
- `$slug`: source-specific identifier
- `fontFamily`
- `fontWeight`
- `fontStyle`

## Example

```json
{
  "__font": {
    "$type": "google",
    "$slug": "inter",
    "fontFamily": "Inter",
    "fontWeight": 600,
    "fontStyle": "normal"
  }
}
```
