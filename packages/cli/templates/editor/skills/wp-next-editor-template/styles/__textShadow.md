# __textShadow

Use `__textShadow` as an array of editable text-shadow entries.

## Feature descriptions

- Array order maps to CSS comma-separated text shadow order.
- Keep derived `textShadow` (a `string[]`) synchronized with this structured array.
- An empty `textShadow: []` array outputs `text-shadow: none` in CSS.

## Entry schema

Each item uses:

- `offsetX`: string (e.g. `"1px"`)
- `offsetY`: string (e.g. `"2px"`)
- `blurRadius`: string (e.g. `"4px"`)
- `color`: string — optional; empty string `""` is allowed and omitted from the CSS output

## CSS output format per entry

`offsetX offsetY blurRadius [color]` — trailing whitespace trimmed when `color` is empty.

## Example — single shadow

```json
{
  "__textShadow": [
    {
      "offsetX": "1px",
      "offsetY": "2px",
      "blurRadius": "4px",
      "color": "#00000066"
    }
  ],
  "textShadow": ["1px 2px 4px #00000066"]
}
```

## Example — multiple shadows

```json
{
  "__textShadow": [
    {
      "offsetX": "0px",
      "offsetY": "1px",
      "blurRadius": "3px",
      "color": "#00000033"
    },
    {
      "offsetX": "2px",
      "offsetY": "4px",
      "blurRadius": "8px",
      "color": "#00000022"
    }
  ],
  "textShadow": ["0px 1px 3px #00000033", "2px 4px 8px #00000022"]
}
```
