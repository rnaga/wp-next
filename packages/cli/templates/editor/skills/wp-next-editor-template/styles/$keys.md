# $ Keys

Use `$*` keys as metadata inside structured style objects. They guide conversion and UI behavior, but they are not direct CSS property names.

## Feature descriptions

- `$` keys are intentionally filtered out from final CSS output.
- They define mode/type and helper payload for converters.
- Most `$` keys exist under `__*` keys.

## Common groups

- Transform metadata: `$type`
- Font metadata (`__font`): `$type`, `$slug`
- Border metadata (`__border`): `$type`, `$all`, `$top`, `$right`, `$bottom`, `$left`, plus `$width/$style/$color` — derived CSS keys use kebab-case (`border-top`, `border-right`, etc.)
- Border radius metadata (`__borderRadius`): `$type`, `$all/$top/$right/$bottom/$left` — corners: `$top`=TL, `$right`=TR, `$bottom`=BR, `$left`=BL
- Outline metadata (`__outline`): `$width`, `$style`, `$color`, `$offset`
- Background metadata (`__background`, `__backgroundGlobal`): `$type`, `$backgroundColor`, `$clip`
- Transition metadata (`__transition`): `$type`, `$duration`, `$cubicBezier`
- Animation metadata (`__animation`): `$id`, `$type`, `$keyframeName`, `$triggerEvent`, `$targetElement`, `$duration`, `$timingFunction`, `$delay`, `$iterationCount`, `$direction`, `$fillMode`, `$playState`

## Example

```json
{
  "__border": {
    "$type": "all",
    "$all": {
      "$width": "1px",
      "$style": "solid",
      "$color": "#333333"
    }
  },
  "__backgroundGlobal": {
    "$backgroundColor": "#ffffff",
    "$clip": "padding-box"
  }
}
```
