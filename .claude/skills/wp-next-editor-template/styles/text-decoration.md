# Text Decoration Style Usage

Use this feature for underline/overline/line-through styling with typed thickness controls.

## Feature descriptions

- Line/color/style are direct CSS keys.
- Thickness is stored in `__textDecorationThickness` for typed mode support.
- Final visible text-decoration is composed from both direct keys and thickness helper.

## Keys in style payload

- Direct keys: `textDecorationLine`, `textDecorationColor`, `textDecorationStyle`
- Helper key: `__textDecorationThickness`

## Authoring rules

- Keep `__textDecorationThickness` if thickness should remain editable.
- Use valid line combinations (exclusive keywords should not be mixed).

## Example

```json
{
  "textDecorationLine": "underline",
  "textDecorationColor": "#cc0000",
  "textDecorationStyle": "solid",
  "__textDecorationThickness": {
    "$type": "length",
    "textDecorationThickness": "2px"
  }
}
```
