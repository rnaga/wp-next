# __letterSpacing

Use `__letterSpacing` for typed letter-spacing values.

## Feature descriptions

- Preserves whether the value is keyword, length, or global CSS keyword.
- Keeps controls editable while still generating correct `letter-spacing` output.

## Supported fields

- `$type`: `normal` | `length` | `global`
- `letterSpacing`: value for selected mode

## Example

```json
{
  "__letterSpacing": {
    "$type": "length",
    "letterSpacing": "0.02em"
  }
}
```
