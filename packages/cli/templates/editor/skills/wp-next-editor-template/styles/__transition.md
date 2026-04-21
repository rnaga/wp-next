# __transition

Use `__transition` as an array of transition descriptors.

## Feature descriptions

- Each entry describes one transition rule.
- Multiple entries are serialized as a comma-separated `transition` string.
- Keep derived `transition` string synchronized.

## Entry fields

- `$type`: transitioned property — e.g. `"all"`, `"opacity"`, `"transform"`, `"color"`
- `$duration`: duration in milliseconds as a **plain number** (no `ms` suffix) — e.g. `300`
- `$cubicBezier`: timing function as a 4-number tuple `[x1, y1, x2, y2]`

## Derived `transition` key

The derived `transition` value is a **string** (not an array), with each entry serialized as `"$type ${$duration}ms cubic-bezier(x1, y1, x2, y2)"` and joined by `", "`.

## Example

```json
{
  "__transition": [
    {
      "$type": "opacity",
      "$duration": 300,
      "$cubicBezier": [0.25, 0.1, 0.25, 1]
    },
    {
      "$type": "transform",
      "$duration": 400,
      "$cubicBezier": [0.4, 0, 0.2, 1]
    }
  ],
  "transition": "opacity 300ms cubic-bezier(0.25, 0.1, 0.25, 1), transform 400ms cubic-bezier(0.4, 0, 0.2, 1)"
}
```
