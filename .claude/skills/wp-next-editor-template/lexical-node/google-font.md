# Google Font Node (`type: "googlefont"`)

## Purpose
Use as global store of Google font families/weights/styles required by CSS usage across the editor.

## Serialization
Serialized type: `SerializedFontNode`

Node-specific field:
- `fonts: GoogleFonts`

## Core Behavior
- Extends `DecoratorNode<null>`.
- Tracks fonts in `__fonts` with defaults (`Roboto`, `Open Sans`).
- Helpers add/remove/sync fonts by scanning node CSS and CSS-variable font references.
- Dispatches `NODE_GOOGLE_FONT_UPDATED` on changes.

## Main APIs
- Factory: `$createGoogleFontNode(node?)`
- Type guard: `$isGoogleFontNode(node)`
- `$getGoogleFontNode(editor)`
- `$addGoogleFont(editor, font)`
- `$removeGoogleFontIfNotUsed(editor, font)`
- `$syncGoogleFont(editor)`
- `getGoogleFonts(editorOrEditors)`
