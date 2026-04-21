# Cache Node (`type: "cache"`)

## Purpose

Internal runtime node for storing arbitrary key-value data within the editor state. Placed as a direct child of root. Does **not** render visible UI and does **not** serialize its data — cache data is runtime-only and is lost across serialization boundaries. It is used by other nodes (e.g. `error-data-fetching`) to communicate runtime state.

## Serialization

Extends `SerializedLexicalNode` with no additional fields. `__data` is intentionally excluded from serialization.

```json
{
  "type": "cache",
  "version": 1
}
```

## Runtime Data

`__data: Record<string, any>` — arbitrary key-value store, not persisted to JSON.

Well-known cache keys used by the system:

| Key | Set by | Read by |
|-----|--------|---------|
| `"__errorData__"` | `WPError` / `$cacheErrorData()` | `ErrorDataFetchingNode.fetch()` |
| `"__query"` | `$storeQueryCache()` | `$getQueryCache()` |
| `"__url_query"` | `$storeURLQuery()` / `$storeURLQueryCacheByName()` | `$getURLQueryCache()` |

## Main APIs

- `$createCacheNode(data?)` — factory
- `$isCacheNode(node)` — type guard
- `$storeCacheData(data, softMerge?)` — write to cache (merge or overwrite)
- `$getCacheData<T>(key)` — read a single key
- `$getAllCacheData()` — read entire cache object
- `$emptyCacheData()` — clear all cache data
- `$storeQueryCache(query)` — merge into `__query` namespace
- `$getQueryCache(key)` — read from `__query` namespace
- `$storeURLQueryCacheByName(dataName, query)` — merge URL query by data node name
- `$getURLQueryCache(dataName, key)` — read URL query cache entry
- `syncCacheData(fromEditor, toEditor)` — copy cache from one editor instance to another

## Notes

- Only one `CacheNode` should exist per editor (placed as a root child).
- Do not include this node in page templates meant for user-facing rendering — it is inserted automatically by the system when needed.
