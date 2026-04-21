# __background

Use `__background` as a layered list of background image descriptors.

## Feature descriptions

- This is the editable source of truth for background layers.
- Layer order is top-to-bottom in array order.
- The derived `background` CSS value must stay synchronized — `__background` and `background` must always produce the same visual result.

## Entry types

`$type`: `url` | `linear-gradient` | `radial-gradient`.

## Type fields

- `url`: `imageUrl`, optional `advancedOptions`
- `linear-gradient`: optional `degrees` (number, e.g. `135`), `values` (flat `string[]` of CSS gradient tokens), optional `advancedOptions`
- `radial-gradient`: `endingShape`, `size`, `top`, `left`, `values` (same flat `string[]` format), optional `advancedOptions`

## CRITICAL: linear-gradient / radial-gradient `values` format

`values` is a **flat array of CSS gradient token strings**. The entries are joined with `", "` and placed inside `linear-gradient(…)` / `radial-gradient(…)` after the `{degrees}deg` prefix.

`__background` and `background` must match. Always derive the `background` string from the `values` entries to verify they are in sync.

Each entry in `values` can be one of:

- **A plain color** — `"#ff0000"`, `"rgba(255,0,0,0.5)"`, etc.
- **A custom value** — any valid CSS gradient token string, including a color with an explicit stop position: `"#005177 0%"`, `"#2271b1 100%"`. Use this when the design requires non-default stop positions.
- **A bare position hint** — `"20%"` as a separate entry, which acts as a CSS midpoint hint between the surrounding colors.

### Pattern A — plain colors (no explicit stop positions needed)

```json
"degrees": 82,
"values": ["#f9d2d2", "#f4f1f1"]
```
Produces: `linear-gradient(82deg, #f9d2d2, #f4f1f1)`

CSS distributes stops evenly when no positions are given.

### Pattern B — custom color+position tokens (explicit stop positions needed)

Each token is `"<color> <position>"` as a single custom string.

```json
"degrees": 135,
"values": ["#0f172a 0%", "#1e3a5f 50%", "#0f4c81 100%"]
```
Produces: `linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f4c81 100%)`

### Pattern C — interleaved position hints (separate entries)

A bare percentage between two colors acts as a CSS midpoint hint, not a stop position.

```json
"degrees": 82,
"values": ["#685e5e", "20%", "#cca3a3"]
```
Produces: `linear-gradient(82deg, #685e5e, 20%, #cca3a3)`

> **Important**: Pattern B and C produce different CSS. `"#0f172a 0%"` (one token, space-separated) is a color stop with an explicit position. `"#0f172a", "0%"` (two separate tokens) makes `0%` a standalone midpoint hint. Use whichever matches the intended `background` CSS.

### NEVER use these invalid formats

They will crash the editor at runtime because `value.values` will be `undefined`:

```json
// ❌ Wrong — $stops / $color / $position / $direction are not recognized fields
{
  "$type": "linear-gradient",
  "$direction": "135deg",
  "$stops": [
    { "$color": "#0f172a", "$position": "0%" },
    { "$color": "#0f4c81", "$position": "100%" }
  ]
}
```

## Advanced options

`advancedOptions` can include:

- `position`: `{ top, left }` as percentages
- `size`: `{ keyword: "cover"|"contain" }` or `{ width, height }`
- `attachment`: `scroll` | `fixed` | `local`
- `repeat`: `repeat` | `no-repeat` | `repeat-x` | `repeat-y`
- `origin`: `border-box` | `padding-box` | `content-box`
- `clip`: `border-box` | `padding-box` | `content-box` | `text`

## Example

```json
{
  "__background": [
    {
      "$type": "url",
      "imageUrl": "https://example.com/hero.jpg",
      "advancedOptions": {
        "repeat": "no-repeat",
        "size": { "keyword": "cover" },
        "position": { "top": 50, "left": 50 }
      }
    },
    {
      "$type": "linear-gradient",
      "degrees": 82,
      "values": ["#f9d2d2", "#f4f1f1"],
      "advancedOptions": {
        "position": { "top": 10, "left": 50 },
        "size": { "width": "100px", "height": "200px" },
        "clip": "border-box",
        "origin": "border-box",
        "attachment": "fixed",
        "repeat": "repeat"
      }
    }
  ],
  "background": [
    "linear-gradient(82deg, #f9d2d2, #f4f1f1) repeat fixed 50% 10% / 100px 200px border-box border-box"
  ]
}
```
