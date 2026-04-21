# Form Node (`type: "form"`)

## Purpose
Use as the form container node for template JSON. It stores form identity, submit behavior settings, and handler mode (`default` vs custom handler type).

## Serialization
Serialized type: `SerializedFormNode`

Node-specific fields:
- `__formId: string` — unique form element id
- `__formHandlerType: string` — submit mode selector (`"default"` or a custom handler key)
- `__submitHandler?: { jsFunction: string; typescriptFunction: string }` — base64-encoded submit handler payload
- `__config: { action: string; redirectUrl?: string }` — submit endpoint/redirect settings
- `__messageClassName: string` — class name used for status message rendering

Inherits base `WPElementNode` fields: `__css`, `__attributes`, `__dynamicAttributes`, `direction`, `format`, `indent`, `children`.

## Handler Mode Rules
- `__formHandlerType = "default"`:
  - Use `__submitHandler` as the form's editable submit logic payload.
  - `typescriptFunction` stores user-editable TypeScript body (base64).
  - `jsFunction` stores compiled runtime JS (base64).
- `__formHandlerType != "default"`:
  - Treat submit logic as hook-driven.
  - The runtime JS should dispatch the WP form submit event.
  - Pair this form with a `form-handler` node configured with matching `formId`, `formHandlerType`, and `messageClassName`.

## JSON Generation Guidance
- Always include `__formHandlerType` explicitly (do not omit it).
- Keep `__formId` stable and unique within the template.
- Keep `__messageClassName` synchronized with the message node rendered inside this form.
- For custom handler mode, add a `form-handler` child node so hook-based submit flows can run.

## JSON Example

```json
{
  "type": "form",
  "version": 1,
  "direction": null,
  "format": "",
  "indent": 0,
  "children": [],
  "__formId": "form-123456",
  "__formHandlerType": "default",
  "__submitHandler": {
    "jsFunction": "Ly8gYmFzZTY0LWVuY29kZWQgcnVudGltZSBKUw==",
    "typescriptFunction": "Ly8gYmFzZTY0LWVuY29kZWQgdXNlciBUUyBib2R5"
  },
  "__config": {
    "action": "",
    "redirectUrl": ""
  },
  "__messageClassName": "p1a2b3c",
  "__css": {
    "__className": "pform123",
    "__externalClassNames": "",
    "__styles": {},
    "__stylesStates": {}
  },
  "__attributes": {},
  "__dynamicAttributes": {
    "__rules": []
  }
}
```

## Main APIs
- Factory: `$createFormNode(node?)`
- Type guard: `$isFormNode(node)`
