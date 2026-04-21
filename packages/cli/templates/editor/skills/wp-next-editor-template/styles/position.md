# Position Style Usage

Use this feature for element positioning, z-order, float/clear, and inset helpers.

## Feature descriptions

- `__position` groups related position fields.
- `inset` stores shorthand for top/right/bottom/left values.
- Inset is most relevant for `absolute`, `fixed`, and `sticky`.

## Keys in style payload

- `__position`

## Authoring rules

- Keep all related keys together under `__position`. No separate top-level CSS keys are needed — the styles-core auto-extracts them.
- Use valid CSS shorthand in `inset` (`top right bottom left`).
- Only include `inset` when `position` is `absolute`, `fixed`, or `sticky`.

## Example

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
