# Spacing Style Usage

Use this feature for margin and padding.

## Feature descriptions

- Spacing uses direct CSS keys (no `__` wrapper key).
- Padding inputs are clamped to non-negative values.
- Supports axis/group editing patterns while storing explicit side keys.

## Keys in style payload

- `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`
- `marginTop`, `marginBottom`, `marginLeft`, `marginRight`

## Authoring rules

- Write explicit side keys for reliable editor behavior.
- Use unitized CSS values (for example `px`, `rem`, `%`, `auto` where valid).
- Avoid negative padding values.

## Example

```json
{
  "paddingTop": "24px",
  "paddingRight": "16px",
  "paddingBottom": "24px",
  "paddingLeft": "16px",
  "marginTop": "0px",
  "marginBottom": "32px",
  "marginLeft": "auto",
  "marginRight": "auto"
}
```
