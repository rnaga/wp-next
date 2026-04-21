import Script from "next/script";
import React from "react";
import { JSDOM } from "jsdom";
import type * as types from "../../types";
import { CUSTOM_CODE_ATTRIBUTE, HTML_TO_JSX } from "./constants";

interface CustomCodeInjectorProps {
  parsedCode: types.ParsedCustomCode;
}

interface CodeItem {
  title: string;
  content: string;
  runOnDOMReady?: boolean;
}

export const StyleInjector = (props: { styles: CodeItem[] }) => {
  const { styles } = props;
  return (
    <>
      {styles.map(({ title, content }, index) => (
        <style key={`style-${index}`} {...{ [CUSTOM_CODE_ATTRIBUTE]: title }}>
          {content}
        </style>
      ))}
    </>
  );
};

export const ScriptInjector = (props: {
  scripts: CodeItem[];
  options?: {
    strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload";
  };
}) => {
  const { scripts, options } = props;
  const strategy = options?.strategy ?? "afterInteractive";
  return (
    <>
      {scripts.map(({ title, content, runOnDOMReady }, index) => {
        const scriptContent = runOnDOMReady
          ? `(function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {${content}});
  } else {
    ${content}
  }
})();`
          : content;

        return (
          <Script
            key={`script-${index}`}
            id={`script-${title}-${index}`}
            {...{ [CUSTOM_CODE_ATTRIBUTE]: title }}
            strategy={strategy}
            dangerouslySetInnerHTML={{ __html: scriptContent }}
          />
        );
      })}
    </>
  );
};

const VOID_TAGS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

const parseHtmlToElements = (
  html: string,
  keyPrefix: string,
  customCodeTitle: string,
  options?: { injectCustomCodeAttribute?: boolean }
): React.ReactNode[] => {
  const injectCustomCodeAttribute = options?.injectCustomCodeAttribute ?? true;
  const dom = new JSDOM(`<body>${html}</body>`);
  const children = Array.from(dom.window.document.body.childNodes);

  return children.map((node, i) => {
    const key = `${keyPrefix}-${i}`;

    if (node.nodeType === node.TEXT_NODE) {
      return node.textContent || null;
    }

    if (node.nodeType !== node.ELEMENT_NODE) {
      return null;
    }

    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const attrs: Record<string, string> = injectCustomCodeAttribute
      ? { key, [CUSTOM_CODE_ATTRIBUTE]: customCodeTitle }
      : { key };
    for (const attr of Array.from(el.attributes)) {
      // Skip inline event handler attributes (e.g. onclick, onmouseover) — React
      // requires function values for event props, not strings, so passing them
      // through would always produce a React warning. They remain in the raw HTML
      // children via dangerouslySetInnerHTML.
      if (attr.name.startsWith("on")) {
        continue;
      }

      attrs[HTML_TO_JSX[attr.name] ?? attr.name] = attr.value;
    }

    if (VOID_TAGS.has(tag)) {
      return React.createElement(tag, attrs);
    }

    return React.createElement(tag, {
      ...attrs,
      dangerouslySetInnerHTML: { __html: el.innerHTML },
    });
  });
};

export const HtmlInjector = (props: {
  html: CodeItem[];
  injectCustomCodeAttribute?: boolean;
}) => {
  const { html, injectCustomCodeAttribute = true } = props;
  return (
    <>
      {html.flatMap(({ title, content }, index) =>
        parseHtmlToElements(content, `html-${index}`, title, {
          injectCustomCodeAttribute,
        })
      )}
    </>
  );
};

export function CodeInjector({ parsedCode }: CustomCodeInjectorProps) {
  const { scripts, styles, html } = parsedCode;

  return (
    <>
      <StyleInjector styles={styles} />
      <ScriptInjector scripts={scripts} />
      <HtmlInjector html={html} />
    </>
  );
}
