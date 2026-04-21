"use client";

import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { $createNode } from "../../../lexical";

import type * as types from "../../../../types";
import { getDecoratorsSync } from "./decorator-loader";
import { useEffect, useRef, useState } from "react";
import { $getRoot } from "lexical";
import {
  $isCacheNode,
  $storeCacheData,
  CacheNode,
} from "../../cache/CacheNode";
import { registerNodeCreators } from "../..";

import { getLexicalEditorConfig } from "../../../editor";
import { processAndGetTemplateSync } from "../../../template";

declare global {
  var __cachedData: Record<string, any>;
  var __rootDivId: string;
  var __editorStateJSON: Record<string, any>;
}

const Content = () => {
  const [editor] = useLexicalComposerContext();
  const [decorators, setDecorators] = useState<React.ReactPortal[]>([]);
  // const decorators = useReactDecorators({
  //   editor,
  //   element: document,
  //   preload,
  // });

  useEffect(() => {
    // const { decorators } = useReactDecoratorsSync({
    //   editor,
    //   element: document,
    // });
    const decorators = getDecoratorsSync({
      excludeRoot: false,
      editor,
      element: document,
    });
    setDecorators(decorators);
  }, []);

  return <>{decorators}</>;
};

const PrepareContent = () => {
  const [editor] = useLexicalComposerContext();
  const [ready, setReady] = useState(false);
  const nodeRegisteredRef = useRef(false);

  useEffect(() => {
    if (!globalThis.__cachedData) {
      return;
    }

    editor.update(
      () => {
        // Register necessary nodes only once
        if (!nodeRegisteredRef.current) {
          registerNodeCreators();
          nodeRegisteredRef.current = true;
        }

        // Check if CacheNode already exists
        const root = $getRoot();
        const existingCacheNode = root.getChildren().find($isCacheNode);

        if (!existingCacheNode) {
          // Create and add CacheNode
          const cacheNode = $createNode(CacheNode);
          $getRoot().append(cacheNode);
        }

        // Store cached data into CacheNode
        $storeCacheData(globalThis.__cachedData);
      },
      {
        discrete: true,
      }
    );

    // 1. Lexical Nodes are registered
    // 2. CacheNode is created and populated with globalThis.__cachedData
    // Note that editor state is ready at this point, but not yet processed with template data

    // Process template to update editor state in editor
    processAndGetTemplateSync(
      editor,
      JSON.stringify(globalThis.__editorStateJSON),
      globalThis.__cachedData
    );

    // Now ready to render decorators (downstream components can proceed)
    setReady(true);
  }, [globalThis.__cachedData]);

  if (!ready) {
    return null;
  }

  return <Content />;
};

export const Decorators = (props?: { isEditing?: boolean }) => {
  const editorConfig = getLexicalEditorConfig({
    isEditing: props?.isEditing || false,
  });

  // This LexicalComposer creates a separate editor instance to handle decorator rendering.
  // The flow is:
  // 1. PrepareContent initializes a CacheNode with globalThis.__cachedData
  // 2. Content uses useReactDecorators to extract and render decorator components
  // 3. Decorators are portaled into #lexical-decorators-container instead of being
  //    rendered inline in this editor instance

  // This separation allows decorators to be hydrated and rendered independently
  // from the main editor while maintaining access to cached data and editor context.
  return (
    <LexicalComposer initialConfig={editorConfig as any}>
      <PrepareContent />
    </LexicalComposer>
  );
};
