import { wpLexicalNodes } from "_wp/lexical";
import { $createTextNode, Klass, LexicalNode, TextNode } from "lexical";

import { registerNodeCreator } from "../lexical";
import { $createAnimationNode, AnimationNode } from "./animation/AnimationNode";
import { $createBodyNode, BodyNode } from "./body/BodyNode";
import {
  $createButtonLinkNode,
  ButtonLinkNode,
} from "./button-link/ButtonLinkNode";
import { $createCacheNode, CacheNode } from "./cache/CacheNode";
import {
  $createCollectionElementNode,
  CollectionElementNode,
} from "./collection/CollectionElementNode";
import {
  $createCollectionNode,
  CollectionNode,
} from "./collection/CollectionNode";
import {
  $createCommentsDataFetchingNode,
  CommentsDataFetchingNode,
} from "./comments-data-fetching/CommentsDataFetchingNode";
import {
  $createCSSVariablesNode,
  CSSVariablesNode,
} from "./css-variables/CSSVariablesNode";
import {
  $createCustomCodeNode,
  CustomCodeNode,
} from "./custom-code/CustomCodeNode";
import {
  $createCustomElementNode,
  CustomElementNode,
} from "./custom-element/CustomElementNode";
import { $createEmbedNode, EmbedNode } from "./embed/EmbedNode";
import {
  $createErrorDataFetchingNode,
  ErrorDataFetchingNode,
} from "./error-data-fetching/ErrorDataFetchingNode";
import { $createCustomFontNode, CustomFontNode } from "./font/CustomFontNode";
import { $createGoogleFontNode, GoogleFontNode } from "./font/GoogleFontNode";
import { $createFieldSetNode, FieldSetNode } from "./form/FieldSetNode";
import { $createFormNode, FormNode } from "./form/FormNode";
import { $createInputNode, InputNode } from "./form/InputNode";
import {
  $createInputWrapperNode,
  InputWrapperNode,
} from "./form/InputWrapperNode";
import { $createLabelNode, LabelNode } from "./form/LabelNode";
import { $createLegendNode, LegendNode } from "./form/LegendNode";
import { $createGridCellNode, GridCellNode } from "./grid/GridCellNode";
import { $createGridNode, GridNode } from "./grid/GridNode";
import { $createHeadingNode, HeadingNode } from "./headling/HeadingNode";
import { $createImageNode, ImageNode } from "./image/ImageNode";
import { $createLinkNode, LinkNode } from "./link/LinkNode";
import { $createListItemNode, ListItemNode } from "./list/ListItemNode";
import { $createListNode, ListNode } from "./list/ListNode";
import {
  $createPaginationNode,
  PaginationNode,
} from "./pagination/PaginationNode";
import {
  $createPostDataFetchingNode,
  PostDataFetchingNode,
} from "./post-data-fetching/PostDataFetchingNode";
import {
  $createPostsDataFetchingNode,
  PostsDataFetchingNode,
} from "./posts-data-fetching/PostsDataFetchingNode";
import { SearchBox } from "./search-box/client/SearchBox";
import {
  $createSearchBoxNode,
  SearchBoxNode,
} from "./search-box/SearchBoxNode";
import {
  $createSettingsDataFetchingNode,
  SettingsDataFetchingNode,
} from "./settings-data-fetching/SettingsDataFetchingNode";
import {
  $createTemplateTextNode,
  TemplateTextNode,
} from "./template-text/TemplateTextNode";
import {
  $createTermsDataFetchingNode,
  TermsDataFetchingNode,
} from "./terms-data-fetching/TermsDataFetchingNode";
import {
  $createUsersDataFetchingNode,
  UsersDataFetchingNode,
} from "./users-data-fetching/UsersDataFetchingNode";
import { $createVideoNode, VideoNode } from "./video/VideoNode";
import { $createWidgetNode, WidgetNode } from "./widget/WidgetNode";
import { $createWidgetRootNode, WidgetRootNode } from "./widget/WidgetRootNode";
import { $createWrapperNode, WrapperNode } from "./wrapper/WrapperNode";
import {
  $createFormHandlerNode,
  FormHandlerNode,
} from "./form/FormHandlerNode";

export const nodeDefaultCreators = new Map<
  Klass<LexicalNode>,
  (...args: any[]) => any
>([
  [BodyNode, $createBodyNode],
  [WrapperNode, $createWrapperNode],
  [TemplateTextNode, $createTemplateTextNode],
  [TextNode, $createTextNode],
  [PostDataFetchingNode, $createPostDataFetchingNode],
  [PostsDataFetchingNode, $createPostsDataFetchingNode],
  [CommentsDataFetchingNode, $createCommentsDataFetchingNode],
  [UsersDataFetchingNode, $createUsersDataFetchingNode],
  [SettingsDataFetchingNode, $createSettingsDataFetchingNode],
  [TermsDataFetchingNode, $createTermsDataFetchingNode],
  [CollectionNode, $createCollectionNode],
  [CollectionElementNode, $createCollectionElementNode],
  [PaginationNode, $createPaginationNode],
  [SearchBoxNode, $createSearchBoxNode],
  [ImageNode, $createImageNode],
  [WidgetNode, $createWidgetNode],
  [WidgetRootNode, $createWidgetRootNode],
  [EmbedNode, $createEmbedNode],
  [GridNode, $createGridNode],
  [GridCellNode, $createGridCellNode],
  [GoogleFontNode, $createGoogleFontNode],
  [CustomFontNode, $createCustomFontNode],
  [CSSVariablesNode, $createCSSVariablesNode],
  [CacheNode, $createCacheNode],
  [AnimationNode, $createAnimationNode],
  [FormNode, $createFormNode],
  [InputNode, $createInputNode],
  [InputWrapperNode, $createInputWrapperNode],
  [FormHandlerNode, $createFormHandlerNode],
  [LabelNode, $createLabelNode],
  [FieldSetNode, $createFieldSetNode],
  [LegendNode, $createLegendNode],
  [ListNode, $createListNode],
  [ListItemNode, $createListItemNode],
  [LinkNode, $createLinkNode],
  [ButtonLinkNode, $createButtonLinkNode],
  [HeadingNode, $createHeadingNode],
  [VideoNode, $createVideoNode],
  [CustomElementNode, $createCustomElementNode],
  [CustomCodeNode, $createCustomCodeNode],
  [ErrorDataFetchingNode, $createErrorDataFetchingNode],
]);

export const registerNodeCreators = () => {
  // Register node creators
  for (const [klass, creator] of nodeDefaultCreators) {
    registerNodeCreator(klass, creator);
  }

  // Register WP Lexical nodes
  for (const registry of wpLexicalNodes) {
    for (const [klass, creator] of registry) {
      registerNodeCreator(klass, creator);
    }
  }
};

export const getWPLexicalNodes = () => {
  let nodes: Array<Klass<LexicalNode>> = [];

  for (const [klass] of nodeDefaultCreators) {
    nodes.push(klass);
  }

  for (const registry of wpLexicalNodes) {
    for (const [klass] of registry) {
      if (!nodes.includes(klass)) {
        nodes.push(klass);
      }
    }
  }

  return nodes;
};

export const getWpLexicalNodePlugins = () => {
  let plugins: Array<React.ComponentType<any>> = [];

  for (const registry of wpLexicalNodes) {
    for (const [, , plugin] of registry) {
      if (!plugins.includes(plugin)) {
        plugins.push(plugin);
      }
    }
  }

  return plugins;
};
