/* eslint-disable react/jsx-no-comment-textnodes */
"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef } from "react";

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { Box } from "@mui/material";
import ThemeRegistry from "@rnaga/wp-next-ui/ThemeRegistry";

import { getLexicalEditorConfig, setEditorMode } from "../../lexical";
import {
  getWpLexicalNodePlugins,
  registerNodeCreators,
} from "../../lexical/nodes";
import { ButtonLinkEditorPlugin } from "../../lexical/nodes/button-link/client/ButtonLinkEditorPlugin";
import { CollectionEditorPlugin } from "../../lexical/nodes/collection/client/CollectionEditorPlugin";
import { CommentsDataFetchingPlugin } from "../../lexical/nodes/comments-data-fetching/client/CommentsDataFetchingPlugin";
import { CustomElementEditorPlugin } from "../../lexical/nodes/custom-element/client/CustomElementEditorPlugin";
import { DataFetchingDataInputContext } from "../../lexical/nodes/data-fetching/client/DataFetchingDataInputContext";
import { EmbedEditorPlugin } from "../../lexical/nodes/embed/client/EmbedEditorPlugin";
import { FormEditorPlugin } from "../../lexical/nodes/form/client/FormEditorPlugin";
import { GridEditorPlugin } from "../../lexical/nodes/grid/client/GridEditorPlugin";
import { HeadingEditorPlugin } from "../../lexical/nodes/headling/client/HeadingEditorPlugin";
import { ImageEditorPlugin } from "../../lexical/nodes/image/client/ImageEditorPlugin";
import { LinkEditorPlugin } from "../../lexical/nodes/link/client/LinkEditorPlugin";
import { ListEditorPlugin } from "../../lexical/nodes/list/client/ListEditorPlugin";
import { PaginationEditorPlugin } from "../../lexical/nodes/pagination/client/PaginationEditorPlugin";
import { PostDataFetchingPlugin } from "../../lexical/nodes/post-data-fetching/client/PostDataFetchingPlugin";
import { PostsDataFetchingPlugin } from "../../lexical/nodes/posts-data-fetching/client/PostsDataFetchingPlugin";
import { SearchBoxEditorPlugin } from "../../lexical/nodes/search-box/client/SearchBoxEditorPlugin";
import { SettingsDataFetchingPlugin } from "../../lexical/nodes/settings-data-fetching/client/SettingsDataFetchingPlugin";
import { TemplateTextEditorPlugin } from "../../lexical/nodes/template-text/client/TemplateTextEditorPlugin";
import { TermsDataFetchingPlugin } from "../../lexical/nodes/terms-data-fetching/client/TermsDataFetchingPlugin";
import { UsersDataFetchingPlugin } from "../../lexical/nodes/users-data-fetching/client/UsersDataFetchingPlugin";
import { VideoEditorPlugin } from "../../lexical/nodes/video/client/VideoEditorPlugin";
import { WidgetEditorPlugin } from "../../lexical/nodes/widget/client/WidgetEditorPlugin";
import { WrapperEditorPlugin } from "../../lexical/nodes/wrapper/client/WrapperEditorPlugin";
import { BreakpointContext } from "../breakpoint";
import { CSSVariablesContext } from "../css-variables/CSSVariablesContext";
import { CustomCodeContext } from "../custom-code/";
import { DragDropEditorPlugin } from "../drag-drop/DragDropEditorPlugin";
import { DraggableContext } from "../draggable";
import { GlobalEventContext } from "../global-event";
import { ContextMenuContext } from "../keys-menu/";
import { NodeEventContext, NodeEventEditorPlugin } from "../node-event";
import { PreviewLayerContext, usePreviewLayer } from "../preview-layer";
import { RefreshContext } from "../refresh";
import { ElementStateContext } from "../right-panel-form/ElementStateContext";
import { RightPanelForm } from "../right-panel-form/RightPanelForm";
import { TemplateContext } from "../template";
import { Header } from "./Header";
import { LeftPanel } from "./LeftPanel";
import { LoadingOverlay } from "./LoadingOverlay";
import { MainArea } from "./MainArea";
import { Toolbar } from "./Toolbar";
import { BodyEditorPlugin } from "../../lexical/nodes/body/client/BodyEditorPlugin";

const Providers = (props: { children: React.ReactNode }) => {
  return (
    <RefreshContext>
      <BreakpointContext>
        <PreviewLayerContext>
          <GlobalEventContext>
            <DataFetchingDataInputContext>
              <TemplateContext>
                <CustomCodeContext>
                  <DraggableContext>
                    <NodeEventContext>
                      <CSSVariablesContext>
                        <ContextMenuContext>
                          <ElementStateContext>
                            {props.children}
                          </ElementStateContext>
                        </ContextMenuContext>
                      </CSSVariablesContext>
                    </NodeEventContext>
                  </DraggableContext>
                </CustomCodeContext>
              </TemplateContext>
            </DataFetchingDataInputContext>
          </GlobalEventContext>
        </PreviewLayerContext>
      </BreakpointContext>
    </RefreshContext>
  );
};

const Plugins = () => {
  const customPlugins = useMemo(() => getWpLexicalNodePlugins(), []);
  return (
    <>
      <CollectionEditorPlugin />
      <FormEditorPlugin />
      <ListEditorPlugin />
      <LinkEditorPlugin />
      <HeadingEditorPlugin />
      <ButtonLinkEditorPlugin />
      <PaginationEditorPlugin />
      <SearchBoxEditorPlugin />
      <WrapperEditorPlugin />
      <TemplateTextEditorPlugin />
      <NodeEventEditorPlugin />
      <ImageEditorPlugin />
      <VideoEditorPlugin />
      <WidgetEditorPlugin />
      <EmbedEditorPlugin />
      <GridEditorPlugin />
      <DragDropEditorPlugin />
      <CustomElementEditorPlugin />
      <BodyEditorPlugin />

      <PostDataFetchingPlugin />
      <PostsDataFetchingPlugin />
      <CommentsDataFetchingPlugin />
      <UsersDataFetchingPlugin />
      <SettingsDataFetchingPlugin />
      <TermsDataFetchingPlugin />

      {customPlugins.map((Plugin, index) => (
        <Plugin key={index} />
      ))}
    </>
  );
};

const Content = () => {
  const ContentEditableRef = ContentEditable as any;
  const { previewMode } = usePreviewLayer();

  return (
    <Box>
      <LoadingOverlay />
      <Header />

      {previewMode === "edit" && (
        <>
          <LeftPanel />
          <RightPanelForm />
        </>
      )}
      <Plugins />

      <Box
        id="main-wrapper"
        sx={{
          position: "relative",
          top: 50,
          height: "calc(100dvh - 50px)",
          overflowY: "hidden",
        }}
      >
        <Box
          sx={{
            display: "grid",
            ...(previewMode === "edit" && {
              gridTemplateColumns: "50px calc(100% - 300px) 250px",
            }),
          }}
        >
          <Box sx={{ width: 50 }} />
          <Box>
            <Toolbar />
            <MainArea>
              <RichTextPlugin
                contentEditable={
                  <ContentEditableRef className="content-editable" />
                }
                ErrorBoundary={LexicalErrorBoundary}
              />
              <AutoFocusPlugin />
            </MainArea>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export const Layout = () => {
  const initialConfig = useRef(
    getLexicalEditorConfig({
      isEditing: true,
    })
  );

  useLayoutEffect(() => {
    registerNodeCreators();
  }, []);

  // Prevent browser back/forward history navigation on horizontal scroll (trackpad swipe).
  // Must use { passive: false } so preventDefault() is allowed — browsers ignore it otherwise.
  // Works across Chrome, Firefox, and Safari.
  useEffect(() => {
    const preventHorizontalNavigation = (e: WheelEvent) => {
      if (e.deltaX !== 0) e.preventDefault();
    };
    window.addEventListener("wheel", preventHorizontalNavigation, {
      passive: false,
    });
    return () =>
      window.removeEventListener("wheel", preventHorizontalNavigation);
  }, []);

  useLayoutEffect(() => {
    setEditorMode(true);
  }, []);

  return (
    <ThemeRegistry>
      <LexicalComposer initialConfig={initialConfig.current}>
        <Providers>
          <Content />
        </Providers>
      </LexicalComposer>
    </ThemeRegistry>
  );
};
