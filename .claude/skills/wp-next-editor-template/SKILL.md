---
name: wp-next-editor-template
description: Generate Lexical editor JSON for this project. Use when creating page templates, building editor state programmatically, working with Lexical node serialization/deserialization, or styling nodes with the CSS system.
argument-hint: "create <output-path> <prompt> | update [json-file] <prompt> | convert <html-file> <css-or-scss-file> <output-path>"
---

# Generate Lexical JSON

## Arguments

`$ARGUMENTS` is parsed as: `<mode> ...args`

- `$0` — Mode: `create`, `update`, or `convert`
- Remaining arguments depend on the mode (see below)

**If no arguments are provided, if `$0` is `help`, or if `$0` is not `create`, `update`, or `convert`**, do not generate any JSON. Instead, stop and show the user the required usage:

```
Usage:
  /wp-next-editor-template create <output-path> <prompt>
  /wp-next-editor-template update [json-file-path] <prompt>
  /wp-next-editor-template convert <html-file> <css-or-scss-file> <output-path>
  /wp-next-editor-template help

Arguments:
  create   Generate a new Lexical JSON template from a natural-language prompt.
  update   Modify an existing Lexical JSON file based on a prompt.
  convert  Convert raw HTML + CSS/SCSS files into a Lexical JSON template.
  help     Show this usage message.

Examples:
  /wp-next-editor-template create src/templates/home.json "A landing page with a hero section, two-column grid, and footer"
  /wp-next-editor-template update src/templates/home.json "Change the hero background color to dark navy and add a CTA button"
  /wp-next-editor-template update "Change the hero background color to dark navy and add a CTA button"
  /wp-next-editor-template convert design/index.html design/styles.css src/templates/home.json
  /wp-next-editor-template convert design/index.html design/styles.scss src/templates/home.json
```

**`create` mode** (`$0` = `create`):

- `$1` is the output path where the new JSON file will be written (create the directory if needed).
- The remaining arguments are the prompt describing the template to generate.
- Generate Lexical JSON based on the prompt, then write it to `$1`.

**`update` mode** (`$0` = `update`):

- `$1` is optionally the path to an existing JSON file to modify. To determine whether `$1` is a file path or the start of the prompt, check if it ends with `.json`.
- If `$1` does not end with `.json` (or is absent), the file path is not provided. In that case, when running inside an editor such as VSCode, use the currently open file as the target. If no file is open, stop and ask the user to provide the file path.
- The remaining arguments (after the optional file path) are the prompt describing what to change and how.
- **Before reading the file**, ask the user: *"Do you know the CSS className of the node you want to update? (It's the `__className` value from `CSS.getClassName()`, e.g. `p1a2b3c`.) Providing it lets me update just that node without loading the full file."*
  - If the user supplies a className, search only for the node whose `__css.__className` matches that value. Read only the relevant portion of the file, apply the change, and write back the minimal diff rather than rewriting the whole file.
  - If the user cannot provide one, fall back to reading and rewriting the full file as before.

**`convert` mode** (`$0` = `convert`):

- `$1` is the path to the source HTML file.
- `$2` is the path to the source stylesheet — either a `.css` or `.scss` file (may be the same file or a separate stylesheet).
- `$3` is the output path where the generated Lexical JSON file will be written (create the directory if needed).
- Read both the HTML and stylesheet files.
- If `$2` is a `.scss` file, mentally flatten SCSS-specific syntax before parsing: resolve nested rules by expanding them into fully-qualified selectors, expand `&` references, and inline `@mixin`/`%placeholder` usages. Treat the result as equivalent plain CSS for style extraction.
- Analyse the HTML structure and map each element to the closest matching Lexical node type (see Node Detail References below). Preserve semantic meaning: headings → `heading`, lists → `list`/`list-item`, images → `image`, links → `link`, generic divs → `wrapper` or `grid`/`grid-cell` depending on layout role.
- Parse the (expanded) CSS to extract styles that apply to each HTML element, then translate those styles into the `__css.__styles` structure used by this project (desktop breakpoint by default; add tablet/mobile breakpoints when `@media` queries are present). Translate class-level and inline styles; discard reset/normalizer rules that have no visual effect.
- Emit valid Lexical JSON (with a required `body` root child) and write it to `$3`.
- If an HTML element has no obvious Lexical equivalent, wrap it in a `custom-element` or `custom-code` node and note the ambiguity in a comment at the top of the output file.

$ARGUMENTS

For an introduction to the Lexical framework, see the [Lexical documentation](https://lexical.dev/docs/intro).

Lexical JSON is the serialized representation of the editor state. Each node has a `type`, `version`, and node-specific properties.

## Structure

All nodes extend from base Lexical types and use the `Spread` utility type for serialization:

```
root (type: "root")
  └── children: LexicalNode[]
```

## Base Node Types

**WPElementNode** (extends `ElementNode`) — base for most block-level nodes:

- `__css`: `Record<string, any>` — CSS styles managed by the `CSS` class
- `__attributes`: `HTMLAttributes<any>` — HTML attributes
- `__dynamicAttributes?`: `Record<string, any>` — dynamic attribute rules

**WPTextNode** (extends `TextNode`) — base for text-level nodes.

**WPDecoratorNode** — base for decorator nodes (non-editable embedded content).

For the full list of available node types, see [node-types.md](node-types.md).
For how the CSS/styles system works (responsive breakpoints, pseudo-states, CSS variables, serialization), see [styles.md](styles.md).
For static HTML attributes (`__attributes`) — reserved keys, serialization, examples — see [attributes.md](attributes.md).
For conditional runtime behavior (`__dynamicAttributes`) — rules, conditions, operators, settings — see [dynamic-attributes.md](dynamic-attributes.md).
For node-specific behavior, JSON fields, and helper APIs, load the matching file from `lexical-node/` before generating JSON for that node.
For style-key shapes and examples, load matching files from `styles/` (for example `styles/%transform.md`, `styles/$keys.md`, `styles/__layout.md`, `styles/__background.md`, `styles/__animation.md`).
For feature-level style behavior (background, box-surface, custom-properties, font, layout, position, spacing, text-decoration, transform, typography), load matching files from `styles/` (for example `styles/background.md`, `styles/box-surface.md`, `styles/transform.md`, `styles/typography.md`).

## UI-Editable Style Contract (Important)

When generating Lexical JSON intended for right-panel editing:

- Put layout/flex container fields under `__layout` (for example `display`, `justifyContent`, `alignItems`, `flexDirection`, `rowGap`, `columnGap`).
- Put flex item fields under `__flexChild` (for example `flex`, `flexGrow`, `flexShrink`, `flexBasis`, `order`).
- For background controls, include background structure keys (`__background` and/or `__backgroundGlobal`) and keep derived `background` in sync.
- For box-surface controls, include structured keys (`__border`, `__borderRadius`, `__outline`, `__boxShadow`) and keep derived CSS keys (`border`, `borderRadius`, `outline`, `outlineOffset`, `boxShadow`) in sync.
- Do not rely on `outline` / `outlineOffset` alone; include matching `__outline` metadata in the same style object so outline forms can round-trip.
- Do not place `__layout` fields as top-level style keys in `__styles.desktop/tablet/mobile`; those values will not round-trip correctly in layout UI forms.

Example:

```json
{
  "__styles": {
    "desktop": {
      "__layout": {
        "display": "flex",
        "justifyContent": "space-between",
        "alignItems": "center"
      },
      "__backgroundGlobal": {
        "$backgroundColor": "#0f172a"
      },
      "background": ["#0f172a"]
    }
  }
}
```

## Node Detail References

Use these first when generating JSON for the listed node types:

- [`body`](lexical-node/body.md)
- [`wrapper`](lexical-node/wrapper.md)
- [`grid`](lexical-node/grid.md)
- [`grid-cell`](lexical-node/grid-cell.md)
- [`image`](lexical-node/image.md)
- [`link`](lexical-node/link.md)
- [`button-link`](lexical-node/button-link.md)
- [`heading`](lexical-node/heading.md)
- [`list`](lexical-node/list.md)
- [`list-item`](lexical-node/list-item.md)
- [`video`](lexical-node/video.md)
- [`embed`](lexical-node/embed.md)
- [`form`](lexical-node/form.md)
- [`form-handler`](lexical-node/form-handler.md)
- [`pagination`](lexical-node/pagination.md)
- [`collection`](lexical-node/collection.md)
- [`collection-element`](lexical-node/collection-element.md)
- [`widget`](lexical-node/widget.md)
- [`widget-root`](lexical-node/widget-root.md)
- [`css-variables`](lexical-node/css-variables.md)
- [`custom-element`](lexical-node/custom-element.md)
- [`search-box`](lexical-node/search-box.md)
- [`animation`](lexical-node/animation.md)
- [`google-font`](lexical-node/google-font.md)
- [`custom-font`](lexical-node/custom-font.md)
- [`data-fetching`](lexical-node/data-fetching.md)
- [`post-data-fetching`](lexical-node/post-data-fetching.md)
- [`posts-data-fetching`](lexical-node/posts-data-fetching.md)
- [`comment-data-fetching`](lexical-node/comment-data-fetching.md)
- [`comments-data-fetching`](lexical-node/comments-data-fetching.md)
- [`terms-data-fetching`](lexical-node/terms-data-fetching.md)
- [`users-data-fetching`](lexical-node/users-data-fetching.md)
- [`settings-data-fetching`](lexical-node/settings-data-fetching.md)
- [`error-data-fetching`](lexical-node/error-data-fetching.md)
- [`cache`](lexical-node/cache.md)
- [`custom-code`](lexical-node/custom-code.md)
- [`react-decorator`](lexical-node/react-decorator.md)
- [`template-text`](lexical-node/template-text.md)
- [`form-input`](lexical-node/form-input.md)
- [`form-label`](lexical-node/form-label.md)

## How `exportJSON` / `importJSON` Work

Each node implements:

- `static importJSON(serializedNode)` — creates a node instance from JSON. Calls instance `importJSON()` for base properties (CSS, attributes, dynamic attributes).
- `exportJSON()` — returns serialized JSON. Always calls `super.exportJSON()` and spreads in node-specific fields with an explicit `type` field.

Pattern for a custom node:

```typescript
static importJSON(serializedNode: SerializedMyNode): MyNode {
  const node = $createMyNode();
  node.importJSON(serializedNode);  // handles __css, __attributes, __dynamicAttributes
  node.__customProp = serializedNode.__customProp;
  return node;
}

exportJSON(): SerializedMyNode {
  return {
    ...super.exportJSON(),
    __customProp: this.__customProp,
    type: "my-node",
  };
}
```

## Body Node (Required)

Every page MUST have exactly one **body** node as a direct child of root. The `body` node acts as the top-level content container for the page (rendered as a `<div data-lexical-body="true">`). Use it to set page-wide styles such as font-family, font-size, and background-color.

All other page content (sections, grids, headings, etc.) should be nested inside this body node.

See [`body`](lexical-node/body.md) for the full node reference and [`styles.md`](styles.md) for CSS system details.

```json
{
  "type": "body",
  "version": 1,
  "direction": null,
  "format": "",
  "indent": 0,
  "children": [],
  "__css": {
    "__className": "p1a2b3c",
    "__externalClassNames": "",
    "__styles": {
      "desktop": {
        "fontFamily": "Inter, sans-serif",
        "fontSize": "16px"
      }
    },
    "__stylesStates": {}
  },
  "__attributes": {},
  "__dynamicAttributes": {}
}
```

## Minimal JSON Example

A page with the required body node:

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
        "type": "body",
        "version": 1,
        "direction": null,
        "format": "",
        "indent": 0,
        "children": [],
        "__css": {
          "__className": "p7a8b9c",
          "__externalClassNames": "",
          "__styles": {},
          "__stylesStates": {}
        },
        "__attributes": {},
        "__dynamicAttributes": {}
      }
    ]
  }
}
```

## Generating JSON Programmatically

Use the headless editor to build and export state:

```typescript
import { $getRoot } from "lexical";
import { createLexicalEditor } from "@rnaga/wp-next-editor/lexical/editor";
import { $createWrapperNode } from "@rnaga/wp-next-editor/lexical/nodes/wrapper/WrapperNode";

const editor = createLexicalEditor({ isHeadless: true });

editor.update(
  () => {
    const root = $getRoot();
    const wrapper = $createWrapperNode();
    root.append(wrapper);
  },
  { discrete: true }
);

const json = editor.getEditorState().toJSON();
```

## Loading JSON into an Editor

```typescript
const editorState = editor.parseEditorState(json);
editor.setEditorState(editorState);
```
