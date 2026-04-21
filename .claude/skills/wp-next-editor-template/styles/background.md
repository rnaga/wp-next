# Background Style Usage

Use this feature when generating layered backgrounds that must remain editable in the right panel.

## Feature descriptions

- `__background` stores structured layers (URL/gradient entries).
- `__backgroundGlobal` stores shared helpers (`$backgroundColor`, `$clip`).
- `background` stores the derived CSS-ready layer array/string values.

## Keys in style payload

- `__background`
- `__backgroundGlobal`
- `background`

## Authoring rules

- Treat `__background` and `__backgroundGlobal` as source-of-truth for editor round-trip.
- Keep derived `background` synchronized.
- Background color/clip helpers are appended as the final layer semantics.

## Example

```json
{
  "__background": [
    {
      "$type": "linear-gradient",
      "degrees": 0,
      "values": ["#8f7070", "#c2bcbc"]
    }
  ],
  "__backgroundGlobal": {
    "$backgroundColor": "#9e7070"
  },
  "background": [
    "linear-gradient(#8f7070, #c2bcbc)",
    "#9e7070"
  ]
}
```
