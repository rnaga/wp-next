# Transform Style Usage

Use this feature for function-style transforms in structured JSON.

## Feature descriptions

- Transform data is stored in `%transform`.
- `%transform` is converted to CSS `transform` during serialization.
- `$type` controls 2D/3D rotate field behavior.

## Keys in style payload

- `%transform`

## Authoring rules

- Include `$type` as `2d` or `3d`.
- In `2d`, use `rotate`; in `3d`, use `rotateX/Y/Z`.
- Keep values unitized for angle/length functions.

## Example

```json
{
  "%transform": {
    "$type": "3d",
    "rotateX": "20deg",
    "rotateY": "10deg",
    "rotateZ": "0deg",
    "skewX": "2deg",
    "skewY": "1deg",
    "perspective": "600px"
  }
}
```
