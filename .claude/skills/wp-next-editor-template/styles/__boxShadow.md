# __boxShadow

Use `__boxShadow` as an array of editable box-shadow entries.

## Feature descriptions

- Array order maps to CSS comma-separated shadow order.
- `position` controls inset/outset behavior.
- Keep derived `boxShadow` synchronized.

## Entry schema

Each item uses:

- `position`: `outset` or `inset`
- `offsetX`
- `offsetY`
- `blurRadius`
- `size` (spread)
- `color`

## Example

```json
{
  "__boxShadow": [
    {
      "position": "outset",
      "offsetX": "0px",
      "offsetY": "8px",
      "blurRadius": "24px",
      "size": "0px",
      "color": "#0000001f"
    }
  ],
  "boxShadow": ["0px 8px 24px 0px #0000001f"]
}
```
