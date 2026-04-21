# __textDecorationThickness

Use `__textDecorationThickness` for typed text-decoration thickness values.

## Feature descriptions

- Preserves mode selection for decoration thickness controls.
- Supports single-keyword mode, length mode, and global keyword mode.

## Supported fields

- `$type`: `singleKeyword` | `length` | `global`
- `textDecorationThickness`: selected value

## Example

```json
{
  "__textDecorationThickness": {
    "$type": "singleKeyword",
    "textDecorationThickness": "from-font"
  }
}
```
