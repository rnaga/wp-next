# Font Style Usage

Use this feature when setting font-family metadata and keeping typography controls editable.

## Two font systems

The editor manages two independent font systems that both live as root-level Lexical nodes:

| System | Lexical type | Source | Identified by |
|---|---|---|---|
| **Google Fonts** | `googlefont` | `GoogleFontNode` | family name string (e.g. `"Inter"`) |
| **Custom Fonts** | `customfonts-data` | `CustomFontNode` | WordPress post slug (e.g. `"my-brand-font"`) |

The `$type` field in `__font` controls which system a node uses: `"google"`, `"custom"`, or `"raw"` (raw CSS `font-family` string, no loader).

---

## Google Fonts

### Available families

`google-fonts-family.json` ships **1,811 families** ordered by Google Fonts popularity. The font picker filters out any family whose name contains `"Icons"` (e.g. Material Icons), so the selectable list is slightly smaller.

The most popular families (top of the list, in order):

> Roboto, Open Sans, Noto Sans JP, Montserrat, Inter, Poppins, Lato, Roboto Condensed, Oswald, Roboto Mono, Noto Sans, Raleway, Nunito Sans, Nunito, Rubik, Ubuntu, Playfair Display, Noto Sans KR, Merriweather, …

### Default fonts

`GoogleFontNode` is always pre-populated with two families so the page has a working font from the start:

```json
{
  "Roboto":     { "fontStyle": ["normal"] },
  "Open Sans":  { "fontStyle": ["normal"] }
}
```

`$syncGoogleFont` and `$clearGoogleFonts` always start from these defaults — they are never removed even when the tree has no nodes using them.

### GoogleFontNode JSON shape

```json
{
  "type": "googlefont",
  "version": 1,
  "fonts": {
    "Inter": {
      "fontStyle": ["normal", "italic"]
    },
    "Roboto": {
      "fontStyle": ["normal"]
    }
  }
}
```

`fonts` is a flat `Record<familyName, { fontStyle: ("normal"|"italic")[] }>`. Each family accumulates all style variants used anywhere in the tree (across all devices). Duplicates are deduplicated when syncing.

`fontWeight` is **not stored** in the `googlefont` node — `buildGoogleFontQueryString` always requests all standard weights (100–900) via `ALL_FONT_WEIGHTS`, so per-family weight tracking is unnecessary.

### Sync behavior

`$syncGoogleFont(editor)` rebuilds `fonts` from scratch by walking every `WPLexicalNode` in the tree across all CSS devices. It collects:
- `fontStyle` from the node's own `__css.__font` (when `$type === "google"`)
- The same field from any CSS variable bound to `fontFamily` on that node

After syncing, it dispatches `NODE_GOOGLE_FONT_UPDATED` so subscribers (e.g. font loaders) can react.

### API link generation

`buildGoogleFontsStyleLink(fonts)` converts the `fonts` record to a Google Fonts CSS API URL:

```
https://fonts.googleapis.com/css?family=Inter:0,100;0,200;...;1,100;1,200;...|Roboto:0,100;...&display=swap
```

All standard weights (100–900) are always requested for every style variant. `oblique` is not supported by the Google Fonts API and is excluded. Only `"normal"` (prefix `0`) and `"italic"` (prefix `1`) are included.

---

## Custom Fonts

`CustomFontNode` extends `DataFetchingNode` and fetches font data from the server by WordPress post slug. It stores slugs (not family names) in its query:

```json
{
  "type": "customfonts-data",
  "query": { "slugs": ["my-brand-font", "accent-typeface"] }
}
```

`$syncCustomFont(editor)` walks the tree and collects every `$slug` from nodes or CSS variables with `$type === "custom"`, then updates the node's query and triggers a re-fetch.

The fetched data includes:
- `fontFamilies` — post metadata
- `fontFaceMap` — `Record<postId, FontFace[]>` with URL, weight, and style per face
- `css` — ready-to-inject `@font-face` CSS string

---

## `__font` key in style payload

Every typography-aware node stores font metadata in `__font` inside its CSS object. The shape is `CSSTypography`:

```ts
{
  $type:      "google" | "custom" | "raw" | undefined;
  $slug:      string | undefined;   // family name for google, post slug for custom
  fontFamily: string | undefined;   // CSS font-family value
  fontWeight?: number;              // 100 | 200 | … | 900
  fontStyle?:  "normal" | "italic";
}
```

### Google font example

```json
{
  "__font": {
    "$type": "google",
    "$slug": "inter",
    "fontFamily": "Inter",
    "fontStyle": "normal"
  }
}
```

### Custom font example

```json
{
  "__font": {
    "$type": "custom",
    "$slug": "my-brand-font",
    "fontFamily": "My Brand Font",
    "fontWeight": 400,
    "fontStyle": "normal"
  }
}
```

### Raw font example

```json
{
  "__font": {
    "$type": "raw",
    "$slug": undefined,
    "fontFamily": "Georgia, serif"
  }
}
```

---

## Authoring rules

- Always include `__font` if you want font controls to round-trip through the editor UI.
- When `__font` is present, `fontFamily` must live **inside** `__font` only — never as a sibling CSS property in the same `desktop`/`mobile` block.
- For Google fonts, `fontFamily` must be the bare family name only — **no CSS fallback stacks** (e.g. `"Inter"`, not `"Inter, sans-serif"`). Fallbacks are added by the font loader at runtime.
- For Google fonts, set `$slug` to the **lowercase family name** (e.g. `"inter"` for `fontFamily: "Inter"`). The sync logic keys on `fontFamily`, but `$slug` is used for identity in pickers.
- For custom fonts, `$slug` must match the WordPress post's `post_name` exactly — the slug drives the data fetch.
- `fontStyle` defaults to `"normal"` when omitted.
- Do not use `"oblique"` as a `fontStyle` value — it is not supported by the Google Fonts API and will be silently ignored in URL generation.
- Both font nodes must be present at the root of the editor state. They are normally inserted during template initialization and should not be removed.
- Every Google font family used in any `__font` block in the template **must** appear in the root-level `googlefont` node's `fonts` map. Without this entry the Google Fonts API URL will not include the family and the font will not load. The `fonts` map only needs `fontStyle` — do **not** include `fontWeight` (it is not tracked; all weights are requested via `ALL_FONT_WEIGHTS`).

---

## Commands

| Command | Payload | When dispatched |
|---|---|---|
| `NODE_GOOGLE_FONT_UPDATED` | `{ node: GoogleFontNode }` | After any add / remove / sync of Google fonts |
| `NODE_CUSTOM_FONT_UPDATED` | `{ node: CustomFontNode }` | After any add / remove / sync of custom fonts |
