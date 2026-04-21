# `__animation`

`__animation` is an array of `CSSAnimation` records stored at `__css.__styles[device].__animation`. Each record is one animation rule: a trigger event, a keyframe, and timing parameters.

---

## Two-part requirement

Animations require JSON entries in **two places**:

1. **`AnimationNode`** (root-level, type `"animation"`) — the keyframe registry. Every keyframe name used anywhere in the document must be listed here.
2. **`__animation` on a content node** — the per-element rules array placed under the appropriate device key (`desktop`, `tablet`, `mobile`, `largeDesktop`).

If a keyframe name appears in a node's `__animation` but is absent from `AnimationNode`, the animation will silently produce no output.

---

## `AnimationNode` — keyframe registry

Must be a direct child of `root`. Exactly one per document.

```json
{
  "type": "animation",
  "version": 1,
  "__presets": ["fadeIn", "bounce"],
  "__customKeyframes": {}
}
```

- `__presets` — array of preset names in use across the document. See [lexical-node/animation.md](../lexical-node/animation.md) for the full preset list.
- `__customKeyframes` — map of custom keyframe name → sanitized `@keyframes` CSS string (inline, no real newlines).

Custom keyframe string format:
```json
{
  "__customKeyframes": {
    "mySlide": "@keyframes mySlide { 0% { opacity: 0; transform: translateX(-40px); } 100% { opacity: 1; transform: translateX(0); } }"
  }
}
```

Custom keyframe names must not collide with any preset name.

---

## `CSSAnimation` fields

| Field | Type | Required | Notes |
|---|---|---|---|
| `$id` | `string` | Yes | Stable unique ID per rule. Use format `"rule-{timestamp}-{random}"` or any unique string. |
| `$type` | `"presets" \| "custom"` | Yes | `"presets"` for Animate.css names; `"custom"` for names in `__customKeyframes`. |
| `$keyframeName` | `string` | Yes | Name of the preset or custom keyframe. Set to `""` to disable the keyframe (emits only `$customProperties`, no `animation` shorthand). |
| `$triggerEvent` | `string` | Yes | See trigger table below. |
| `$targetElement` | `string` | No | CSS class name of the element to animate. Omit or set `""` to animate the source element itself. |
| `$pseudoElement` | `string` | No | `"::before"` or `"::after"`. Appended to the selector. |
| `$customProperties` | `Record<string, string>` | No | Extra CSS properties injected into the rule block before `animation`. Useful for pseudo-element setup (e.g. `content`, `position`). |
| `$duration` | `string` | Yes | e.g. `"700ms"` |
| `$timingFunction` | `string` | Yes | e.g. `"ease-in-out"`, `"ease"`, `"linear"`, `"cubic-bezier(0.68,-0.55,0.265,1.55)"` |
| `$delay` | `string` | Yes | e.g. `"0ms"`, `"200ms"` |
| `$iterationCount` | `string` | Yes | `"1"`, `"2"`, `"3"`, `"infinite"` |
| `$direction` | `string` | Yes | `"normal"`, `"reverse"`, `"alternate"`, `"alternate-reverse"` |
| `$fillMode` | `string` | Yes | `"none"`, `"forwards"`, `"backwards"`, `"both"` |
| `$playState` | `string` | Yes | Always `"running"` |

---

## Trigger events and output behavior

| `$triggerEvent` | CSS output pattern | JS generated? |
|---|---|---|
| `"hover"` | `.el:hover { animation: ... }` | No |
| `"focus"` | `.el:focus { animation: ... }` | No |
| `"load"` | `.el { animation: ... }` (applied directly) | No |
| `"click"` | `.el.is-animating-{id} { animation: ... }` | Yes — `click` + `touchend` listeners |
| `"dblclick"` | `.el.is-animating-{id} { animation: ... }` | Yes |
| `"mouseenter"` | `.el.is-animating-{id} { animation: ... }` | Yes |
| `"mouseleave"` | `.el.is-animating-{id} { animation: ... }` | Yes |
| `"blur"` | `.el.is-animating-{id} { animation: ... }` | Yes |
| `"scroll"` | `.el.is-animating-{id} { animation: ... }` | Yes — fires when scrolling while hovering |

When `$targetElement` is set:
- `hover` / `focus` use `body:has(.source:hover) .target { animation: ... }` — no JS.
- JS triggers animate `.target.is-animating-{id}` and the event listener is still attached to the source element.

When `$pseudoElement` is set, it is appended to whichever selector is generated:
- `hover`: `.el:hover::after { ... }`
- `load`: `.el::after { ... }`
- `click`: `.el.is-animating-{id}::after { ... }`

---

## Placement in `__css`

`__animation` is stored at device level inside `__styles`. It does **not** inherit across breakpoints — each device key is independent.

```json
"__css": {
  "__className": "p1a2b3c",
  "__externalClassNames": "",
  "__styles": {
    "desktop": {
      "__animation": [ ...rules... ]
    },
    "mobile": {
      "__animation": [ ...different rules... ]
    }
  },
  "__stylesStates": {}
}
```

Omit `__animation` entirely for devices where no animation is needed.

---

## Examples

### Fade in on page load (preset, source element)

```json
{
  "$id": "rule-001",
  "$type": "presets",
  "$keyframeName": "fadeIn",
  "$triggerEvent": "load",
  "$targetElement": "",
  "$duration": "800ms",
  "$timingFunction": "ease-out",
  "$delay": "0ms",
  "$iterationCount": "1",
  "$direction": "normal",
  "$fillMode": "both",
  "$playState": "running"
}
```

AnimationNode entry: `"__presets": ["fadeIn"]`

---

### Bounce on hover (targets a different element)

```json
{
  "$id": "rule-002",
  "$type": "presets",
  "$keyframeName": "bounce",
  "$triggerEvent": "hover",
  "$targetElement": "hero-icon",
  "$duration": "700ms",
  "$timingFunction": "ease-in-out",
  "$delay": "0ms",
  "$iterationCount": "1",
  "$direction": "normal",
  "$fillMode": "none",
  "$playState": "running"
}
```

Generated CSS: `body:has(.source-class:hover) .hero-icon { animation: bounce 700ms ease-in-out 0ms 1 normal none running; }`

---

### Slide in on click (JS trigger, infinite loop)

```json
{
  "$id": "rule-003",
  "$type": "presets",
  "$keyframeName": "slideInLeft",
  "$triggerEvent": "click",
  "$targetElement": "",
  "$duration": "500ms",
  "$timingFunction": "ease",
  "$delay": "0ms",
  "$iterationCount": "infinite",
  "$direction": "alternate",
  "$fillMode": "none",
  "$playState": "running"
}
```

---

### Custom keyframe on scroll

```json
{
  "$id": "rule-004",
  "$type": "custom",
  "$keyframeName": "myPop",
  "$triggerEvent": "scroll",
  "$targetElement": "",
  "$duration": "600ms",
  "$timingFunction": "cubic-bezier(0.68,-0.55,0.265,1.55)",
  "$delay": "0ms",
  "$iterationCount": "1",
  "$direction": "normal",
  "$fillMode": "forwards",
  "$playState": "running"
}
```

AnimationNode entry: `"__customKeyframes": { "myPop": "@keyframes myPop { 0% { transform: scale(0); } 100% { transform: scale(1); } }" }`

---

### Pseudo-element overlay (disabled keyframe, custom properties only)

Applies `content` and `position` to a `::after` overlay without playing any animation:

```json
{
  "$id": "rule-005",
  "$type": "presets",
  "$keyframeName": "",
  "$triggerEvent": "hover",
  "$targetElement": "",
  "$pseudoElement": "::after",
  "$customProperties": {
    "content": "\"\"",
    "position": "absolute",
    "inset": "0",
    "background": "rgba(0,0,0,0.3)"
  },
  "$duration": "300ms",
  "$timingFunction": "ease",
  "$delay": "0ms",
  "$iterationCount": "1",
  "$direction": "normal",
  "$fillMode": "none",
  "$playState": "running"
}
```

Generated CSS: `.el:hover::after { content: ""; position: absolute; inset: 0; background: rgba(0,0,0,0.3); }` — no `animation` property because `$keyframeName` is `""`.

---

### Fade in with pseudo-element (keyframe + custom properties)

```json
{
  "$id": "rule-006",
  "$type": "presets",
  "$keyframeName": "fadeIn",
  "$triggerEvent": "hover",
  "$targetElement": "",
  "$pseudoElement": "::after",
  "$customProperties": {
    "content": "\"\"",
    "position": "absolute",
    "inset": "0"
  },
  "$duration": "400ms",
  "$timingFunction": "ease-in-out",
  "$delay": "0ms",
  "$iterationCount": "1",
  "$direction": "normal",
  "$fillMode": "forwards",
  "$playState": "running"
}
```

Generated CSS: `.el:hover::after { content: ""; position: absolute; inset: 0; animation: fadeIn 400ms ease-in-out 0ms 1 normal forwards running; }`

---

### Multiple rules on one node (device-targeted)

```json
"__css": {
  "__className": "pHeroText",
  "__externalClassNames": "",
  "__styles": {
    "desktop": {
      "__animation": [
        {
          "$id": "rule-d1",
          "$type": "presets",
          "$keyframeName": "fadeInUp",
          "$triggerEvent": "load",
          "$targetElement": "",
          "$duration": "800ms",
          "$timingFunction": "ease-out",
          "$delay": "0ms",
          "$iterationCount": "1",
          "$direction": "normal",
          "$fillMode": "both",
          "$playState": "running"
        },
        {
          "$id": "rule-d2",
          "$type": "presets",
          "$keyframeName": "pulse",
          "$triggerEvent": "hover",
          "$targetElement": "",
          "$duration": "1000ms",
          "$timingFunction": "ease-in-out",
          "$delay": "0ms",
          "$iterationCount": "infinite",
          "$direction": "normal",
          "$fillMode": "none",
          "$playState": "running"
        }
      ]
    },
    "mobile": {
      "__animation": [
        {
          "$id": "rule-m1",
          "$type": "presets",
          "$keyframeName": "fadeIn",
          "$triggerEvent": "load",
          "$targetElement": "",
          "$duration": "500ms",
          "$timingFunction": "ease",
          "$delay": "0ms",
          "$iterationCount": "1",
          "$direction": "normal",
          "$fillMode": "both",
          "$playState": "running"
        }
      ]
    }
  },
  "__stylesStates": {}
}
```

AnimationNode entry: `"__presets": ["fadeInUp", "pulse", "fadeIn"]`

---

## Full page JSON skeleton with animations

```json
{
  "root": {
    "type": "root",
    "version": 1,
    "direction": null,
    "format": "",
    "indent": 0,
    "children": [
      {
        "type": "animation",
        "version": 1,
        "__presets": ["fadeIn"],
        "__customKeyframes": {}
      },
      {
        "type": "body",
        "version": 1,
        "direction": null,
        "format": "",
        "indent": 0,
        "__css": {
          "__className": "pBody",
          "__externalClassNames": "",
          "__styles": {},
          "__stylesStates": {}
        },
        "__attributes": {},
        "__dynamicAttributes": {},
        "children": [
          {
            "type": "wrapper",
            "version": 1,
            "direction": null,
            "format": "",
            "indent": 0,
            "__css": {
              "__className": "pHero",
              "__externalClassNames": "",
              "__styles": {
                "desktop": {
                  "__animation": [
                    {
                      "$id": "rule-hero-1",
                      "$type": "presets",
                      "$keyframeName": "fadeIn",
                      "$triggerEvent": "load",
                      "$targetElement": "",
                      "$duration": "800ms",
                      "$timingFunction": "ease-out",
                      "$delay": "0ms",
                      "$iterationCount": "1",
                      "$direction": "normal",
                      "$fillMode": "both",
                      "$playState": "running"
                    }
                  ]
                }
              },
              "__stylesStates": {}
            },
            "__attributes": {},
            "__dynamicAttributes": {},
            "children": []
          }
        ]
      }
    ]
  }
}
```

---

## Checklist when generating `__animation` JSON

- [ ] `AnimationNode` exists as a direct child of `root` with `type: "animation"`.
- [ ] Every preset `$keyframeName` used in any rule is listed in `AnimationNode.__presets`.
- [ ] Every custom `$keyframeName` used in any rule has a matching entry in `AnimationNode.__customKeyframes`.
- [ ] Custom keyframe names do not conflict with any preset name.
- [ ] `$id` is unique across all rules in the document.
- [ ] `$type` is `"presets"` for Animate.css names and `"custom"` for user-defined names.
- [ ] Empty `$keyframeName` (`""`) is used only when the intent is to inject `$customProperties` without playing an animation.
- [ ] `__animation` is placed under the correct device key (`desktop`, `tablet`, `mobile`, `largeDesktop`), not at the top of `__styles`.
- [ ] All string-valued timing fields (`$duration`, `$delay`) include the `ms` unit suffix.
