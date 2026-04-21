# __border

Use `__border` for border metadata that drives the border UI and derived border CSS keys.

## Feature descriptions

- Supports one-value mode (`all`) or per-side mode (`individual`).
- Width `0` means no visible border (the side value is set to `undefined`).
- Keep derived border keys synchronized with the `__border` structured value.

## Supported shape

- `$type`: `all` or `individual`
- `$all` for all-sides mode
- `$top`, `$right`, `$bottom`, `$left` for side mode
- nested value keys: `$width`, `$style`, `$color`

## Supported `$style` values

`solid` | `dashed` | `dotted` | `double` | `groove` | `ridge` | `inset` | `outset`

## CRITICAL: derived border keys are camelCase

All CSS property keys in `__styles` must use camelCase (see `styles.md`). Border derived keys follow the same rule.

For all-sides mode, the derived key is `border` (shorthand string).
For individual mode, the derived keys are **`borderTop`**, **`borderRight`**, **`borderBottom`**, **`borderLeft`** — all camelCase.

```json
// ❌ Wrong — kebab-case keys are not recognized
"border-top": "1px solid #333"

// ✅ Correct — camelCase
"borderTop": "1px solid #333"
```

## Example — all-sides

```json
{
  "__border": {
    "$type": "all",
    "$all": { "$width": "1px", "$style": "solid", "$color": "#333" }
  },
  "border": "1px solid #333"
}
```

## Example — individual sides

```json
{
  "__border": {
    "$type": "individual",
    "$top": { "$width": "1px", "$style": "solid", "$color": "#333" },
    "$right": { "$width": "2px", "$style": "dashed", "$color": "#555" },
    "$bottom": { "$width": "1px", "$style": "solid", "$color": "#333" },
    "$left": { "$width": "2px", "$style": "dashed", "$color": "#555" }
  },
  "borderTop": "1px solid #333",
  "borderRight": "2px dashed #555",
  "borderBottom": "1px solid #333",
  "borderLeft": "2px dashed #555"
}
```
