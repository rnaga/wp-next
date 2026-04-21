# __flexChild

Use `__flexChild` for flex item-level values.

## Feature descriptions

- Controls sizing/order for a child inside a flex container.
- Supports explicit `flex` shorthand or individual grow/shrink/basis fields.
- Supports order presets used by UI (`-9999` first, `9999` last).

## Supported fields

`flexGrow`, `flexShrink`, `flexBasis`, `flex`, `order`.

## Example

```json
{
  "__flexChild": {
    "flex": "1 1 auto",
    "order": "0"
  }
}
```
