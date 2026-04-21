# %transform

Use `%transform` when you want object-form transform data in JSON and automatic serialization to the CSS `transform` property.

## Feature descriptions

- `%transform` keeps transform functions as named object keys.
- During CSS output, `%` is removed and object entries become function calls.
- `$type` is metadata (`2d` or `3d`) and is not emitted as a function.

## Supported fields

`$type`, `translateX`, `translateY`, `translateZ`, `scaleX`, `scaleY`, `scaleZ`, `rotate`, `rotateX`, `rotateY`, `rotateZ`, `skewX`, `skewY`, `perspective`.

## Mode behavior

- `$type: "2d"`: use `rotate`; ignore `rotateX/Y/Z`.
- `$type: "3d"`: use `rotateX/Y/Z`; ignore `rotate`.

## Example

```json
{
  "%transform": {
    "$type": "3d",
    "rotateX": "20deg",
    "rotateY": "10deg",
    "rotateZ": "0deg",
    "skewX": "2deg",
    "perspective": "600px"
  }
}
```
