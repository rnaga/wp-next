# Animation Node (`type: "animation"`)

## Purpose
Global animation registry node for preset and custom keyframes. Placed as a direct child of `$getRoot()`. Exactly one per document. Does not render visible UI — it is a metadata/registry node only.

## Serialization
Serialized type: `SerializedAnimationNode` (extends `SerializedLexicalNode`)

Node-specific fields:
- `__presets: AnimationPreset[]` — array of preset keyframe names in use (default `[]`)
- `__customKeyframes: Record<string, string>` — map of custom keyframe name to `@keyframes` CSS string (default `{}`)

## Available Preset Names

| Category | Presets |
|---|---|
| Attention Seekers | `bounce`, `flash`, `pulse`, `rubberBand`, `shakeX`, `shakeY`, `headShake`, `swing`, `tada`, `wobble`, `jello`, `heartBeat` |
| Back Entrances | `backInDown`, `backInLeft`, `backInRight`, `backInUp` |
| Back Exits | `backOutDown`, `backOutLeft`, `backOutRight`, `backOutUp` |
| Bouncing Entrances | `bounceIn`, `bounceInDown`, `bounceInLeft`, `bounceInRight`, `bounceInUp` |
| Bouncing Exits | `bounceOut`, `bounceOutDown`, `bounceOutLeft`, `bounceOutRight`, `bounceOutUp` |
| Fading Entrances | `fadeIn`, `fadeInDown`, `fadeInDownBig`, `fadeInLeft`, `fadeInLeftBig`, `fadeInRight`, `fadeInRightBig`, `fadeInUp`, `fadeInUpBig`, `fadeInTopLeft`, `fadeInTopRight`, `fadeInBottomLeft`, `fadeInBottomRight` |
| Fading Exits | `fadeOut`, `fadeOutDown`, `fadeOutDownBig`, `fadeOutLeft`, `fadeOutLeftBig`, `fadeOutRight`, `fadeOutRightBig`, `fadeOutUp`, `fadeOutUpBig`, `fadeOutTopLeft`, `fadeOutTopRight`, `fadeOutBottomRight`, `fadeOutBottomLeft` |
| Rotating Entrances | `rotateIn`, `rotateInDownLeft`, `rotateInDownRight`, `rotateInUpLeft`, `rotateInUpRight` |
| Rotating Exits | `rotateOut`, `rotateOutDownLeft`, `rotateOutDownRight`, `rotateOutUpLeft`, `rotateOutUpRight` |
| Zooming Entrances | `zoomIn`, `zoomInDown`, `zoomInLeft`, `zoomInRight`, `zoomInUp` |
| Zooming Exits | `zoomOut`, `zoomOutDown`, `zoomOutLeft`, `zoomOutRight`, `zoomOutUp` |
| Sliding Entrances | `slideInDown`, `slideInLeft`, `slideInRight`, `slideInUp` |
| Sliding Exits | `slideOutDown`, `slideOutLeft`, `slideOutRight`, `slideOutUp` |
| Flippers | `flip`, `flipInX`, `flipInY`, `flipOutX`, `flipOutY` |
| Lightspeed | `lightSpeedInRight`, `lightSpeedInLeft`, `lightSpeedOutRight`, `lightSpeedOutLeft` |
| Specials | `hinge`, `jackInTheBox`, `rollIn`, `rollOut` |

## Custom Keyframes Format

```typescript
// key: user-defined name (must not conflict with preset names)
// value: sanitized @keyframes CSS string (newlines stripped, whitespace collapsed)
{
  "mySlideIn": "@keyframes mySlideIn { 0% { opacity: 0; transform: translateX(-50px); } 100% { opacity: 1; transform: translateX(0); } }"
}
```

## How Nodes Reference Animations

Any `WPElementNode` or `WPTextNode` can have an `__animation` array in its `__css` styles. Each entry is a `CSSAnimation`:

```typescript
type CSSAnimation = {
  $id: string;              // unique animation instance ID
  $type: "presets" | "custom";
  $keyframeName: string;    // must match a preset name or key in __customKeyframes
  $triggerEvent: string;    // "load", "hover", "click", "dblclick", "scroll", "focus", "active"
  $targetElement?: string;  // optional CSS class target
  $duration: string;        // e.g. "1000ms"
  $timingFunction: string;  // e.g. "ease-in-out", "ease", "linear", "cubic-bezier(...)"
  $delay: string;           // e.g. "0ms", "200ms"
  $iterationCount: string;  // e.g. "1", "infinite"
  $direction: string;       // "normal", "reverse", "alternate", "alternate-reverse"
  $fillMode: string;        // "none", "forwards", "backwards", "both"
  $playState: string;       // "running", "paused"
};
```

The `$keyframeName` must be registered in this `AnimationNode` — either as a preset in `__presets` or a key in `__customKeyframes`.

**Important:** `__animation` does NOT inherit across breakpoints (excluded from vertical merge).

## Trigger Events

- **CSS triggers** (`hover`, `focus`, `active`): applied via pseudo-selectors
- **JS triggers** (`click`, `dblclick`, `scroll`): generate event listeners at runtime
- **Page load** (`load`): direct animation without JS

## JSON Example

```json
{
  "type": "animation",
  "version": 1,
  "__presets": ["fadeIn", "bounceInUp", "slideInLeft"],
  "__customKeyframes": {
    "myFly": "@keyframes myFly { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }"
  }
}
```

### CSSAnimation entry on a node's `__css.__styles.desktop.__animation`:

```json
[{
  "$id": "anim-abc123",
  "$type": "presets",
  "$keyframeName": "fadeIn",
  "$triggerEvent": "load",
  "$duration": "800ms",
  "$timingFunction": "ease-out",
  "$delay": "200ms",
  "$iterationCount": "1",
  "$direction": "normal",
  "$fillMode": "both",
  "$playState": "running"
}]
```

## Main APIs
- Factory: `$createAnimationNode(node?)`
- Type guard: `$isAnimationNode(node)`
- `$getAnimationNode()`
- `$addAnimationPreset(editor, preset)`
- `$addAnimationCustomKeyframe(editor, name, keyframe)`
- `$removeAnimationPresetIfNotUsed(editor, preset, options?)`
- `$removeAnimationCustomKeyframeIfNotUsed(editor, keyframeName)`
