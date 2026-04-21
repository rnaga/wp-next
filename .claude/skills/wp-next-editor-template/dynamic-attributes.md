# Dynamic Attributes (`__dynamicAttributes`)

`__dynamicAttributes` enables conditional, runtime-driven behavior on any `WPElementNode` or `WPTextNode`. Rules are evaluated against live data-fetching context. When a rule's conditions are met, its settings (visibility, CSS classes, custom HTML attributes) are applied to the rendered DOM element.

## JSON Shape

```json
"__dynamicAttributes": {
  "__rules": [
    {
      "conditionOperator": "all",
      "conditions": [
        {
          "type": "data-fetching",
          "key": "${post.ID}",
          "operator": "lt",
          "value": 100
        }
      ],
      "settings": {
        "display": true,
        "externalClassnames": ["highlight", "featured"],
        "customAttributes": {
          "data-featured": "true"
        }
      }
    }
  ]
}
```

An empty or default value (no rules):

```json
"__dynamicAttributes": {}
```

or

```json
"__dynamicAttributes": { "__rules": [] }
```

---

## Rule Structure

Each item in `__rules` is a `DynamicAttributeRule`:

| Field | Type | Description |
|-------|------|-------------|
| `conditionOperator` | `"all"` \| `"any"` | `"all"` = AND (every condition must pass); `"any"` = OR (at least one must pass) |
| `conditions` | `DynamicAttributeCondition[]` | List of conditions to evaluate |
| `settings` | `DynamicAttributeSettings` | What to apply when conditions are met |

A rule with an **empty `conditions` array** never fires — zero conditions always evaluates to `false`.

---

## Condition Structure (`DynamicAttributeCondition`)

| Field | Type | Description |
|-------|------|-------------|
| `type` | `"data-fetching"` | Currently only `"data-fetching"` is supported |
| `key` | `string` | Template key referencing a data-fetching value, e.g. `${post.ID}`, `${item.post_title}` |
| `operator` | `ConditionOperator` | Comparison operator (see table below) |
| `value` | `string \| number` | The value to compare against |

### Key Format

Keys must be wrapped in `${}` template syntax and reference a data variable available in the current data-fetching context:

- `${post.ID}` — scalar post field
- `${item.post_modified}` — item field in a loop/collection
- `${%variant.name}` — widget variant key

The key is resolved at runtime via the template text processor. If the key cannot be resolved (still contains `${`), the condition evaluates to `false`.

### Operators by Data Type

**String** (`string`, `unknown`):

| Operator | Label |
|----------|-------|
| `contains` | Contains |
| `not_contains` | Does not contain |
| `equals` | Equals |
| `not_equals` | Does not equal |

**Number** (`number`):

| Operator | Label |
|----------|-------|
| `lt` | Less than |
| `eq` | Equal to |
| `gt` | Greater than |
| `lte` | Less than or equal |
| `gte` | Greater than or equal |
| `mod_zero` | Divisible by |

**Date** (`date`):

| Operator | Label |
|----------|-------|
| `before` | Before |
| `after` | After |
| `on` | On (same calendar day) |

**Boolean** (`boolean`):

| Operator | Label |
|----------|-------|
| `is_true` | Is true |
| `is_false` | Is false |

> Boolean fields: `"true"`, `"1"`, and `"yes"` are treated as truthy; everything else is falsy.

---

## Settings Structure (`DynamicAttributeSettings`)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `display` | `boolean` | `true` | If `false`, sets `display: none` on the element when conditions are met |
| `externalClassnames` | `string[] \| undefined` | `undefined` | CSS class names to add to the element when conditions are met |
| `customAttributes` | `Record<string, string>` | `{}` | HTML attributes to set on the element when conditions are met |

**Important:** `externalClassnames` added by dynamic rules are **transient** — they are applied directly to the DOM and are never merged into `__css.__externalClassNames`. They are removed when conditions no longer hold.

---

## Evaluation Logic

Rules are evaluated in order on every render update. For each rule:

1. Each condition's `key` is resolved from the data-fetching context.
2. The resolved value is compared against `value` using `operator`.
3. If `conditionOperator` is `"all"`, all conditions must be `true`; if `"any"`, at least one must be `true`.
4. If the rule passes, its `settings` are applied.

Multiple rules can match simultaneously — their settings are applied in order. If a later rule also sets `display: false`, it will override a previous `display: true` from an earlier rule (since the DOM property is set sequentially).

Before re-applying, all previously applied dynamic attributes (display override, dynamic classnames, dynamic custom attributes) are **cleared** so stale state is never left behind.

---

## Availability

Dynamic attributes are only shown in the UI (right panel) when **data keys exist** in the current editor context or widget variants are present. In JSON, you can always include `__dynamicAttributes` on any `WPElementNode` or `WPTextNode` — it is silently ignored if no data context is available at render time.

---

## Examples

### Hide an element when a post ID is 0

```json
"__dynamicAttributes": {
  "__rules": [
    {
      "conditionOperator": "all",
      "conditions": [
        {
          "type": "data-fetching",
          "key": "${post.ID}",
          "operator": "eq",
          "value": 0
        }
      ],
      "settings": {
        "display": false,
        "externalClassnames": undefined,
        "customAttributes": {}
      }
    }
  ]
}
```

### Add a CSS class and custom attribute when a post title contains "Featured"

```json
"__dynamicAttributes": {
  "__rules": [
    {
      "conditionOperator": "all",
      "conditions": [
        {
          "type": "data-fetching",
          "key": "${post.post_title}",
          "operator": "contains",
          "value": "Featured"
        }
      ],
      "settings": {
        "display": true,
        "externalClassnames": ["is-featured"],
        "customAttributes": {
          "data-featured": "true"
        }
      }
    }
  ]
}
```

### Multiple conditions with "any" (OR logic)

```json
"__dynamicAttributes": {
  "__rules": [
    {
      "conditionOperator": "any",
      "conditions": [
        {
          "type": "data-fetching",
          "key": "${post.post_status}",
          "operator": "equals",
          "value": "draft"
        },
        {
          "type": "data-fetching",
          "key": "${post.post_status}",
          "operator": "equals",
          "value": "pending"
        }
      ],
      "settings": {
        "display": false,
        "externalClassnames": undefined,
        "customAttributes": {}
      }
    }
  ]
}
```

### Multiple rules (both can fire independently)

```json
"__dynamicAttributes": {
  "__rules": [
    {
      "conditionOperator": "all",
      "conditions": [
        {
          "type": "data-fetching",
          "key": "${post.ID}",
          "operator": "lt",
          "value": 100
        }
      ],
      "settings": {
        "display": true,
        "externalClassnames": ["new-post"],
        "customAttributes": {}
      }
    },
    {
      "conditionOperator": "all",
      "conditions": [
        {
          "type": "data-fetching",
          "key": "${post.comment_count}",
          "operator": "gt",
          "value": 10
        }
      ],
      "settings": {
        "display": true,
        "externalClassnames": ["popular"],
        "customAttributes": {
          "data-popular": "true"
        }
      }
    }
  ]
}
```

---

## Relationship to `__attributes`

| | `__attributes` | `__dynamicAttributes` |
|---|---|---|
| When applied | Always (static) | Only when rule conditions are met (runtime) |
| Scope | Persistent in DOM | Transient — cleared and reapplied on each render |
| Custom HTML attributes | Direct key/value pairs | Inside `settings.customAttributes` within a rule |
| CSS classes | Not supported (use `__css`) | `settings.externalClassnames` (transient only) |
| Visibility control | Not supported | `settings.display: false` |

---

## Serialization

`DynamicAttributes` is a class instance on each node. On `exportJSON`, it serializes to `{ __rules: [...] }`. On `importJSON`, the base node method reconstructs the instance from the `__rules` array.

When writing JSON directly (e.g. for templates), always use the shape:

```json
"__dynamicAttributes": {
  "__rules": [ /* rule objects */ ]
}
```

An empty `__dynamicAttributes: {}` is also valid and equivalent to no rules.
