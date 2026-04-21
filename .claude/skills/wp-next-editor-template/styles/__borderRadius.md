# __borderRadius

Use `__borderRadius` for border-radius metadata.

## Feature descriptions

- Supports `all` mode and per-corner mode.
- Keep derived `borderRadius` synchronized for output.

## Supported shape

- `$type`: `all` or `individual`
- `$all` for all corners (single value applied to all four)
- `$top`, `$right`, `$bottom`, `$left` for per-corner values

## CRITICAL: corner mapping

Despite the directional names, these keys map to CSS `border-radius` corners in the standard TL/TR/BR/BL order:

| Key | CSS corner |
|---|---|
| `$top` | top-left |
| `$right` | top-right |
| `$bottom` | bottom-right |
| `$left` | bottom-left |

Serialized output: `border-radius: $top $right $bottom $left`

## Example — all corners

```json
{
  "__borderRadius": {
    "$type": "all",
    "$all": "8px"
  },
  "borderRadius": "8px"
}
```

## Example — individual corners

```json
{
  "__borderRadius": {
    "$type": "individual",
    "$top": "8px",
    "$right": "8px",
    "$bottom": "16px",
    "$left": "16px"
  },
  "borderRadius": "8px 8px 16px 16px"
}
```
