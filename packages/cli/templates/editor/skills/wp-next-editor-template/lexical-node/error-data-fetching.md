# Error Data Fetching Node (`type: "error-data"`)

## Purpose

Specialized data node for error page templates (e.g. `error-not-found`, `error-forbidden`). Provides dynamic error type and message to template text nodes. Hidden from the editor left panel (`__hidden: true`). Its `name` is always `"error"`.

This node is **inserted automatically** by the system when an error template is created or loaded — you do not normally need to add it manually. However, it must be present in any error page template JSON for error data to render.

## Serialization

Inherits `SerializedDataFetchingNode`. No additional serialized fields. See [data-fetching.md](data-fetching.md) for the base shape.

## Query Format

No query parameters. `ALLOWED_QUERY_PASSTHROUGH_KEYS = []`.

## Data Flow

1. At render time, `WPError` writes `{ error_type, error_message }` into the `CacheNode` under key `"__errorData__"`.
2. `ErrorDataFetchingNode.fetch()` reads that cache entry and returns it.
3. Falls back to `{ error_type: "UNKNOWN_ERROR", error_message: "An unexpected error occurred." }` if nothing is cached.

## Fetched Data Shape (validated by Zod)

```typescript
{
  error_type: string;    // one of TEMPLATE_ERROR_STATUS_TYPES enum values
  error_message: string; // default: "error"
}
```

## JSON Example

```json
{
  "type": "error-data",
  "version": 1,
  "name": "error",
  "ID": 38291,
  "query": {},
  "options": {},
  "allowedQueryPassthroughKeys": []
}
```

## Template Text Usage

```
${error.error_type}     → e.g. "NOT_FOUND", "FORBIDDEN"
${error.error_message}  → human-readable error message
```

## Main APIs

- Factory: `$createErrorDataFetchingNode()`
- Type guard: `$isErrorDataFetchingNode(node)`
- `$checkAndInsertErrorDataFetchingNode(slug)` — inserts the node if missing (called automatically for error slugs)
- `$cacheErrorData(errorType, errorMessage)` — write error info into `CacheNode`
- Constant: `CACHE_ERROR_DATA_KEY = "__errorData__"`
