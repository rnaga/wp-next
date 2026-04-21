# __position

Use `__position` for position-related properties.

## Feature descriptions

- Groups all positioning properties into one editable structure.
- All fields inside `__position` are automatically extracted to CSS output by the styles-core — no separate top-level CSS keys are needed.
- `inset` is only relevant when `position` is `absolute`, `fixed`, or `sticky`.

## Supported fields

- `position`: `static` | `relative` | `absolute` | `fixed` | `sticky`
- `zIndex`: number string (e.g. `"10"`)
- `float`: `none` | `left` | `right`
- `clear`: `none` | `left` | `right` | `both`
- `inset`: CSS shorthand string in `top right bottom left` order (e.g. `"10px auto auto 20px"`)

## Example — absolute with inset

```json
{
  "__position": {
    "position": "absolute",
    "zIndex": "10",
    "float": "none",
    "clear": "none",
    "inset": "10px auto auto 20px"
  }
}
```

## Example — sticky (top only)

```json
{
  "__position": {
    "position": "sticky",
    "zIndex": "100",
    "inset": "0px auto auto auto"
  }
}
```
