# __layout

Use `__layout` for nested layout-related CSS properties.

## Feature descriptions

- `display` selects block/flex/grid modes.
- Flex/grid container controls are stored here.
- Grid child placement keys are also stored here.
- Keeping layout keys under `__layout` is required for UI round-trip.

## CRITICAL: layout properties must be inside `__layout`

`display`, `flexDirection`, `justifyContent`, `alignItems`, `columnGap`, `rowGap`, `gridTemplateColumns`, etc. **must never appear directly in the styles object**. They must always be nested under `__layout`.

```json
// ❌ Wrong — layout props at top level will not render correctly
"desktop": {
  "display": "flex",
  "justifyContent": "center",
  "columnGap": "16px"
}

// ✅ Correct
"desktop": {
  "__layout": {
    "display": "flex",
    "justifyContent": "center",
    "columnGap": "16px"
  }
}
```

When overriding layout for a breakpoint, only include the keys that change — `display` does not need to be repeated if it was already set on desktop:

```json
"desktop": {
  "__layout": {
    "display": "flex",
    "justifyContent": "center",
    "alignItems": "center",
    "columnGap": "16px"
  }
},
"mobile": {
  "__layout": {
    "flexDirection": "column",
    "rowGap": "12px"
  }
}
```

## Common fields

- Container: `display`, `gridTemplateColumns`, `gridTemplateRows`, `gridAutoFlow`, `justifyContent`, `alignItems`, `flexDirection`, `rowGap`, `columnGap`
- Grid child: `gridColumnStart`, `gridColumnEnd`, `gridRowStart`, `gridRowEnd`, `gridColumn`, `gridRow`, `order`

## Example

```json
{
  "__layout": {
    "display": "grid",
    "gridTemplateColumns": "1fr 1fr",
    "gridTemplateRows": "auto auto",
    "rowGap": "16px",
    "columnGap": "16px"
  }
}
```
