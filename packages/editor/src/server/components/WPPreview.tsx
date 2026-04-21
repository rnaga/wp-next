"use server";

import { WPProvider } from "@rnaga/wp-next-core/client/wp";
import { getLoggingConfig } from "@rnaga/wp-next-core/server/utils/logger";

import { ScriptInjector } from "../../lexical/resource-loader/server";
import { IframePreviewRenderer } from "../../client/preview-layer/IframePreviewRenderer";
import { RESOURCE_TITLES } from "../../lexical/resource-loader/constants";

export default async function WPPreview() {
  const rootDivId = `root-${Math.floor(Math.random() * 1000000)}`;

  const inlineScripts = [
    {
      title: RESOURCE_TITLES.ROOT_DIV_ID,
      content: `globalThis.__rootDivId = "${rootDivId}";`,
    },
  ];

  return (
    <WPProvider logging={getLoggingConfig()}>
      {/* Inject inline scripts for runtime functionality */}
      <ScriptInjector scripts={inlineScripts} />

      <div id={rootDivId} />
      <IframePreviewRenderer />
    </WPProvider>
  );
}
