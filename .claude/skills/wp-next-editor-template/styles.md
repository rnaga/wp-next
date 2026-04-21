# Styles System

Use this guide when generating Lexical template JSON. It explains how style data is stored, which keys are editor-friendly, and how to keep JSON round-trippable in the WP editor UI.

## ⚠️ CRITICAL: All CSS property keys in `__styles` must be camelCase

Every direct CSS property key written inside a breakpoint object (`desktop`, `tablet`, `mobile`) or a `__stylesStates` state object must use **camelCase** — not kebab-case.

```json
// ❌ Wrong — kebab-case keys are not recognized
"padding-top": "24px",
"font-size": "16px",
"border-bottom": "3px solid #333",
"background-color": "transparent"

// ✅ Correct — camelCase
"paddingTop": "24px",
"fontSize": "16px",
"borderBottom": "3px solid #333",
"backgroundColor": "transparent"
```

This rule applies to all direct CSS keys: spacing (`paddingTop`, `marginLeft`), typography (`fontSize`, `fontWeight`, `letterSpacing`), colors (`backgroundColor`), borders (`borderBottom`), and any other CSS property name. Keys **inside** structured helper objects (`__layout`, `__border`, `__font`, etc.) follow their own internal conventions and are not subject to this rule.

## Where Styles Live In Lexical JSON

Each node stores styles in `__css`.

- `__css.__styles.desktop` for default styles.
- `__css.__styles.tablet` and `__css.__styles.mobile` for breakpoint overrides.
- `__css.__stylesStates.<state>.<device>` for pseudo-state styles (`hover`, `focus`, `active`, etc).

Example node style payload:

```json
{
  "__css": {
    "__className": "p1a2b3c",
    "__externalClassNames": "hero-section",
    "__styles": {
      "desktop": {
        "__layout": {
          "display": "flex",
          "justifyContent": "space-between",
          "alignItems": "center"
        },
        "paddingTop": "48px",
        "paddingBottom": "48px"
      },
      "tablet": {
        "__layout": {
          "flexDirection": "column"
        }
      },
      "mobile": {}
    },
    "__stylesStates": {}
  }
}
```

## Prompt To JSON Workflow

When the prompt is like `create lexical template JSON for sample homepage`:

1. Generate a Lexical JSON document with the required node tree.
2. Put style keys in each node's `__css.__styles.desktop` (and tablet/mobile if needed).
3. Save to a file such as `home.json`.
4. Paste/import that JSON in WP editor.

## Special Prefixes

- `__key`: structured helper groups that expand to CSS.
- `$key`: metadata fields used inside structured groups.
- `%key`: object-form function CSS (for example `%transform`).

## Serialization Rules

- Nested `__` object keys are flattened into normal CSS keys when CSS is generated.
- `__` array keys (such as `__textShadow`, `__boxShadow`, `__background`) are handled by their dedicated converters.
- `$` keys are metadata only and are not emitted as CSS property names.
- `%` keys are serialized as function CSS by removing `%` (`%transform` -> `transform`).

## UI Round-Trip Rules

To keep right-panel forms editable after loading JSON:

- Keep container layout fields in `__layout`.
- Keep flex item fields in `__flexChild`.
- Keep background structured data in `__background` and/or `__backgroundGlobal` and keep `background` synchronized.
- Keep outline metadata in `__outline` and keep `outline`/`outlineOffset` synchronized.
- Keep border/radius/shadow metadata (`__border`, `__borderRadius`, `__boxShadow`) with their derived CSS keys.

## Core Structured Keys

| Key | Main purpose | Typical fields |
|---|---|---|
| `__layout` | layout container and grid child placement | `display`, `gridTemplateColumns`, `gridTemplateRows`, `justifyContent`, `alignItems`, `rowGap`, `columnGap`, `gridColumn*`, `gridRow*`, `order` |
| `__flexChild` | flex item sizing/order | `flexGrow`, `flexShrink`, `flexBasis`, `flex`, `order` |
| `__position` | positioning helper | `position`, `zIndex`, `float`, `clear`, `inset` |
| `__font` | font metadata | `$type`, `$slug`, `fontFamily`, `fontWeight`, `fontStyle` |
| `__letterSpacing` | typed letter-spacing control | `$type`, `letterSpacing` |
| `__textDecorationThickness` | typed decoration thickness | `$type`, `textDecorationThickness` |
| `__textShadow` | editable text-shadow list | array of `{ offsetX, offsetY, blurRadius, color }` |
| `__boxShadow` | editable box-shadow list | array of `{ position, offsetX, offsetY, blurRadius, size, color }` |
| `__border` | border metadata | `$type`, `$all/$top/$right/$bottom/$left` |
| `__outline` | outline metadata | `$width`, `$style`, `$color`, `$offset` |
| `__borderRadius` | radius metadata | `$type`, `$all/$top/$right/$bottom/$left` |
| `__transition` | transition list | array of `{ $type, $duration, $cubicBezier }` |
| `__background` | background layers | array of image/gradient descriptors |
| `__backgroundGlobal` | global background helpers | `$backgroundColor`, `$clip` |
| `__animation` | interaction animation rules | array of animation rule objects |
| `__customProperties` | encoded custom property payload | base64 JSON string/object payload |
| `__externalClassNames` | extra class names | space-delimited string |

## Responsive And State Merge Behavior

- Breakpoints inherit desktop -> tablet -> mobile.
- Pseudo-state inherits from `none` and then overrides with state-specific keys.
- `__animation` is treated specially and does not cascade like normal style keys.

## Key References

- [`%transform`](styles/%transform.md)
- [`$ keys`](styles/$keys.md)
- [`__layout`](styles/__layout.md)
- [`__flexChild`](styles/__flexChild.md)
- [`__position`](styles/__position.md)
- [`__font`](styles/__font.md)
- [`__letterSpacing`](styles/__letterSpacing.md)
- [`__textDecorationThickness`](styles/__textDecorationThickness.md)
- [`__textShadow`](styles/__textShadow.md)
- [`__boxShadow`](styles/__boxShadow.md)
- [`__border`](styles/__border.md)
- [`__outline`](styles/__outline.md)
- [`__borderRadius`](styles/__borderRadius.md)
- [`__transition`](styles/__transition.md)
- [`__background`](styles/__background.md)
- [`__backgroundGlobal`](styles/__backgroundGlobal.md)
- [`__animation`](styles/__animation.md)
- [`__customProperties`](styles/__customProperties.md)
- [`__externalClassNames`](styles/__externalClassNames.md)

## Feature References

- [`background`](styles/background.md)
- [`box-surface`](styles/box-surface.md)
- [`custom-properties`](styles/custom-properties.md)
- [`font`](styles/font.md)
- [`layout`](styles/layout.md)
- [`position`](styles/position.md)
- [`spacing`](styles/spacing.md)
- [`text-decoration`](styles/text-decoration.md)
- [`transform`](styles/transform.md)
- [`typography`](styles/typography.md)
