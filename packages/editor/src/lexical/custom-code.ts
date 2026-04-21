import { LexicalEditor } from "lexical";
import type * as types from "../types";
import { getAllCustomCodes } from ".";

export const generateCustomCodeByEditor = async (
  editor: LexicalEditor
): Promise<Record<types.CustomCodeInjectLocation, string>> => {
  const customCodes = await getAllCustomCodes(editor);
  return {
    header: generateCustomCode(customCodes.header ?? []),
    footer: generateCustomCode(customCodes.footer ?? []),
  };
};

export const generateCustomCode = (customCodes: types.CustomCodes) => {
  const content: string[] = [];
  for (const customCode of customCodes) {
    const mimeType = customCode.metas.mime_type.split("/")[1];
    content.push(`<!-- start ${customCode.post_title} -->`);
    content.push(
      mimeType === "javascript"
        ? `<script>${customCode.post_content}</script>`
        : mimeType === "css"
          ? `<style>${customCode.post_content}</style>`
          : customCode.post_content
    );
    content.push(`<!-- end ${customCode.post_title} -->`);
  }

  return content.join("\n");
};

export const parseCustomCode = (
  customCodes: types.CustomCodes
): types.ParsedCustomCode => {
  const scripts: Array<{ title: string; content: string }> = [];
  const styles: Array<{ title: string; content: string }> = [];
  const html: Array<{ title: string; content: string }> = [];

  for (const customCode of customCodes) {
    const mimeType = customCode.metas.mime_type.split("/")[1];
    const item = {
      title: customCode.post_title,
      content: customCode.post_content,
    };

    if (mimeType === "javascript") {
      scripts.push(item);
    } else if (mimeType === "css") {
      styles.push(item);
    } else {
      html.push(item);
    }
  }

  return { scripts, styles, html };
};

const CUSTOM_CODE_MARKER = "custom-code-start";

// Injects custom code HTML into an element after a marker comment.
// On each call, everything after the marker comment is removed
// (including dynamically created nodes like Tailwind's <style> tags),
// then fresh content is appended. Nodes before the marker are untouched.
//
// Use this when the element contains other children that must be preserved
// (e.g. <head> or <body> where Lexical/framework nodes live alongside
// injected custom code). Only the region after the marker is replaced.
//
// Pass a unique `suffixMarkerName` when calling setInnerHTML multiple times on
// the same element so each call manages its own independent region. The full
// marker comment becomes `custom-code-start-{suffixMarkerName}`.
export const setInnerHTML = (
  element: HTMLElement,
  html: string,
  suffixMarkerName: string
) => {
  const markerName = `${CUSTOM_CODE_MARKER}-${suffixMarkerName}`;

  // Find existing marker comment
  let marker: Comment | null = null;
  for (const node of Array.from(element.childNodes)) {
    if (
      node.nodeType === Node.COMMENT_NODE &&
      (node as Comment).data.trim() === markerName
    ) {
      marker = node as Comment;
      break;
    }
  }

  // Remove everything after the marker
  if (marker) {
    while (marker.nextSibling) {
      marker.nextSibling.remove();
    }
  }

  // Create marker if this is the first call
  if (!marker) {
    marker = document.createComment(markerName);
    element.appendChild(marker);
  }

  if (!html) return;

  // Parse the new HTML into a temporary container
  const temp = document.createElement("div");
  temp.innerHTML = html;

  Array.from(temp.childNodes).forEach((node) => {
    // Scripts need to be re-created to execute
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      (node as Element).tagName === "SCRIPT"
    ) {
      const oldScriptEl = node as HTMLScriptElement;
      const newScriptEl = document.createElement("script");

      Array.from(oldScriptEl.attributes).forEach((attr) => {
        newScriptEl.setAttribute(attr.name, attr.value);
      });

      const scriptText = document.createTextNode(oldScriptEl.innerHTML);
      newScriptEl.appendChild(scriptText);
      element.appendChild(newScriptEl);
    } else {
      element.appendChild(node);
    }
  });
};

// Replaces the entire innerHTML of an element, then re-creates <script> tags
// so the browser executes them (setting innerHTML alone doesn't run scripts).
//
// Unlike setInnerHTML, this wipes ALL existing children. Use this when the
// element is a dedicated container whose full content should be replaced
// (e.g. EmbedNode's preview wrapper).
export const replaceInnerHTML = (element: HTMLElement, html: string) => {
  element.innerHTML = html;

  Array.from(element.querySelectorAll("script")).forEach((oldScriptEl) => {
    const newScriptEl = document.createElement("script");

    Array.from(oldScriptEl.attributes).forEach((attr) => {
      newScriptEl.setAttribute(attr.name, attr.value);
    });

    const scriptText = document.createTextNode(oldScriptEl.innerHTML);
    newScriptEl.appendChild(scriptText);

    oldScriptEl?.parentNode?.replaceChild(newScriptEl, oldScriptEl);
  });
};
