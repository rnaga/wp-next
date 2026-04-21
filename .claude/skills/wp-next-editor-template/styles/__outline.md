# __outline

Use `__outline` for outline metadata.

## Feature descriptions

- Stores editable outline configuration.
- Width `0` means outline should be removed.
- Keep `outline` and `outlineOffset` synchronized for output.

## Supported fields

`$width`, `$style`, `$color`, `$offset`.

## Example

```json
{
  "__outline": {
    "$width": "2px",
    "$style": "solid",
    "$color": "#0d6efd",
    "$offset": "2px"
  },
  "outline": "2px solid #0d6efd",
  "outlineOffset": "2px"
}
```
