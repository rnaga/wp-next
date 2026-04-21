# Form Handler Node (`type: "form-handler"`)

## Purpose
Use as a decorator node that connects form submit events to WP hook-based handlers. This node is especially important when a form uses a non-default `__formHandlerType`.

## Serialization
Serialized type: `SerializedFormHandlerNode`

Node-specific fields:
- `__config: { formId?: string; formHandlerType?: string; messageClassName?: string }`

Inherits `ReactDecoratorNode` fields:
- `ID: number`
- `__css: Record<string, any>`
- `__dynamicAttributes?: Record<string, any>`

## Core Behavior
- Decorator node (not an element container).
- Uses `__config.formId` to bind to the form submit custom event.
- Uses `__config.formHandlerType` to choose which WP hook handler flow should run.
- Uses `__config.messageClassName` for message updates in handler logic.
- If required config values are missing, it effectively no-ops.

## JSON Generation Guidance
- Keep `__config.formId` equal to the parent form's `__formId`.
- Keep `__config.formHandlerType` equal to the parent form's `__formHandlerType`.
- Keep `__config.messageClassName` equal to the parent form's `__messageClassName`.
- For non-default handler forms, include exactly one `form-handler` child for that form.

## JSON Example

```json
{
  "type": "form-handler",
  "version": 1,
  "format": "start",
  "ID": 38124,
  "__config": {
    "formId": "form-123456",
    "formHandlerType": "google_contact",
    "messageClassName": "p1a2b3c"
  },
  "__css": {
    "__className": "",
    "__externalClassNames": "",
    "__styles": {},
    "__stylesStates": {}
  },
  "__dynamicAttributes": {
    "__rules": []
  }
}
```

## Main APIs
- Factory: `$createFormHandlerNode(node?)`
- Type guard: `$isFormHandlerNode(node)`
