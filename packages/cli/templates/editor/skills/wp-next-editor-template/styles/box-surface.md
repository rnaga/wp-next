# Box Surface Style Usage

Use this feature for border, outline, radius, shadow, and opacity styles.

## Feature descriptions

- Structured metadata keys keep box-surface controls editable.
- Derived CSS keys are needed for actual style output.
- Both structured and derived keys should be present together.

## Keys in style payload

- Border (all-sides): `__border` + `border`
- Border (individual): `__border` + `borderTop` / `borderRight` / `borderBottom` / `borderLeft` (camelCase)
- Outline: `__outline` + `outline` + `outlineOffset`
- Radius: `__borderRadius` + `borderRadius`
- Shadow: `__boxShadow` + `boxShadow`
- Opacity: `opacity`

## Authoring rules

- Do not rely on only derived border/outline/radius/shadow keys.
- Keep `__border`, `__outline`, `__borderRadius`, `__boxShadow` for round-trip editing.
- Width `0` border/outline values effectively clear visible stroke.

## Example

```json
{
  "__border": {
    "$type": "all",
    "$all": { "$width": "1px", "$style": "solid", "$color": "#333" }
  },
  "border": "1px solid #333",
  "__outline": {
    "$width": "2px",
    "$style": "solid",
    "$color": "#0d6efd",
    "$offset": "2px"
  },
  "outline": "2px solid #0d6efd",
  "outlineOffset": "2px",
  "__borderRadius": { "$type": "all", "$all": "12px" },
  "borderRadius": "12px",
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
  "boxShadow": ["0px 8px 24px 0px #0000001f"],
  "opacity": "0.9"
}
```
