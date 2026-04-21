# Available Node Types

| Type | Node Class |
|------|-----------|
| `wrapper` | `WrapperNode` |
| `grid` | `GridNode` |
| `grid-cell` | `GridCellNode` |
| `image` | `ImageNode` |
| `link` | `LinkNode` |
| `button-link` | `ButtonLinkNode` |
| `heading` | `HeadingNode` |
| `list` | `ListNode` |
| `list-item` | `ListItemNode` |
| `video` | `VideoNode` |
| `embed` | `EmbedNode` |
| `form` | `FormNode` |
| `form-handler` | `FormHandlerNode` |
| `pagination` | `PaginationNode` |
| `collection` | `CollectionNode` |
| `collection-element` | `CollectionElementNode` |
| `widget` | `WidgetNode` |
| `widget-root` | `WidgetRootNode` |
| `css-variables` | `CSSVariablesNode` |
| `custom-element` | `CustomElementNode` |
| `search-box` | `SearchBoxNode` |
| `animation` | `AnimationNode` |
| `google-font` | `GoogleFontNode` |
| `custom-font` | `CustomFontNode` |
| `data-fetching` | `DataFetchingNode` |
| `post-data-fetching` | `PostDataFetchingNode` |
| `posts-data-fetching` | `PostsDataFetchingNode` |
| `template-text` | `TemplateTextNode` |

## Node Conventions

- Node factory functions: `$create<NodeName>Node()`
- Type guard functions: `$is<NodeName>Node()`
- Serialized types: `Serialized<NodeName>Node` (uses `Spread<{...}, SerializedParent>`)
- All element nodes extend `WPElementNode` which provides `__css`, `__attributes`, and `__dynamicAttributes`
