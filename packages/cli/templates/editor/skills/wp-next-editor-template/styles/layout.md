# Layout Style Usage

Use this feature for container layout and item-level flex/grid placement.

## Feature descriptions

- `__layout` is the required container for display/grid/flex controls.
- `__flexChild` stores flex item sizing/order.
- Layout keys outside `__layout` can break right-panel round-trip.

## Keys in style payload

- Container layout: `__layout`
- Flex item controls: `__flexChild`

## Authoring rules

- Put `display`, flex/grid controls, and grid child placement in `__layout`.
- Put `flex`, `flexGrow`, `flexShrink`, `flexBasis`, `order` for flex items in `__flexChild`.

## Example

```json
{
  "__layout": {
    "display": "grid",
    "gridTemplateColumns": "1fr 1fr",
    "gridAutoFlow": "row",
    "rowGap": "16px",
    "columnGap": "16px"
  },
  "__flexChild": {
    "flex": "1 1 auto",
    "order": "0"
  }
}
```
