# Typography Style Usage

Use this feature for text color/size/alignment, font metadata, shadows, and decoration helpers.

## Feature descriptions

- Mixes direct CSS text keys with structured helper keys.
- `__font`, `__letterSpacing`, `__textShadow`, and `__textDecorationThickness` preserve editor modes.
- `textShadow` is typically derived from `__textShadow`.

## Keys in style payload

- Font metadata: `__font`
- Direct typography keys: `color`, `fontSize`, `lineHeight`, `textIndent`, `textAlign`, `textTransform`, `wordBreak`, `lineBreak`, `textWrap`, `textOverflow`
- Structured helpers: `__letterSpacing`, `__textShadow`, `__textDecorationThickness`
- Derived array key: `textShadow`

## Authoring rules

- Keep structured helper keys for round-trip editing.
- Keep derived keys (`textShadow`) synchronized with helper arrays.

## Example

```json
{
  "__font": {
    "$type": "google",
    "$slug": "inter",
    "fontFamily": "Inter",
    "fontWeight": 700,
    "fontStyle": "normal"
  },
  "color": "#111111",
  "fontSize": "16px",
  "lineHeight": "1.6",
  "textAlign": "left",
  "__letterSpacing": {
    "$type": "length",
    "letterSpacing": "0.02em"
  },
  "__textShadow": [
    {
      "offsetX": "0px",
      "offsetY": "1px",
      "blurRadius": "3px",
      "color": "#00000055"
    }
  ],
  "textShadow": ["0px 1px 3px #00000055"]
}
```
