// Tags in this list must be safe to use as containers for template text that
// may include arbitrary HTML with block-level elements.
//
// Tags with a "phrasing content" model (p, summary) auto-close when the
// browser encounters a block-level element inside them, causing children to
// escape the container entirely — those must NOT appear here.
//
// h1–h6 are phrasing-content-only but are intentionally included because
// template-text nodes that use a heading tag should only contain plain-text
// templates (e.g. post titles). They will break if given block-level HTML,
// but that is a misuse of the heading element type, not a bug in this list.
export const HTML_CONTAINER_ELEMENT_TAGS = [
  "address",
  "article",
  "aside",
  "blockquote",
  "div",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "main",
  "section",
] as const;
