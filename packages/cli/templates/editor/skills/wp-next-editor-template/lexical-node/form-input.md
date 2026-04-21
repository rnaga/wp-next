# Form Input Node (`type: "form-input"`)

## Purpose
Use to render a real `<input>` element with a configurable type. Unlike `template-text`, this node creates a native HTML input, so it is the correct choice whenever a functional form field or a checkbox/radio toggle is needed (e.g. DaisyUI drawer toggle, accordion, tabs).

## Serialization
Serialized type: `SerializedInputNode` (`Spread<{ __formName, __inputType, __inputAttributes }, SerializedWPElementNode>`)

Node-specific fields:
- `__formName: string` — maps to the `name` attribute on the rendered `<input>`
- `__inputType: InputType` — HTML input type (see valid values below)
- `__inputAttributes: InputAttributes` — optional `placeholder` and `value` attributes

Inherits base `WPElementNode` fields: `__css`, `__attributes`, `__dynamicAttributes`, `direction`, `format`, `indent`, `children`.

## Valid `__inputType` Values

```
"text" | "email" | "password" | "number" |
"checkbox" | "radio" |
"submit" | "reset" | "button" |
"date" | "datetime-local" | "file" | "hidden" | "image" |
"month" | "range" | "search" | "tel" | "time" | "url" | "week"
```

## Core Behavior
- Extends `WPElementNode`.
- `initDOM()` creates a real `<input>` element, sets `name` and `type` attributes, and applies some default layout CSS (`display: inline-flex`, `height: 30px`).
- `isEmpty()` always returns `false`.
- `id` and other HTML attributes must be set via `__attributes`.

## JSON Example

```json
{
  "type": "form-input",
  "version": 1,
  "direction": null,
  "format": "",
  "indent": 0,
  "children": [],
  "__formName": "my-drawer",
  "__inputType": "checkbox",
  "__inputAttributes": {},
  "__css": {
    "__className": "p1a2b3c",
    "__externalClassNames": "drawer-toggle",
    "__styles": {},
    "__stylesStates": {}
  },
  "__attributes": {
    "id": "my-drawer"
  },
  "__dynamicAttributes": {
    "__rules": []
  }
}
```

## Main APIs
- Factory: `$createInputNode(node?)`
- Type guard: `$isInputNode(node)`
- `setInputType(inputType)`
- `setFormName(formName)`
- `setInputAttribute(key, value)`
