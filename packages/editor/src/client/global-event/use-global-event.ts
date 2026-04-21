import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useNodeEvent } from "../node-event";
import { useDragDrop } from "../drag-drop";
import { useBreakpoint } from "../breakpoint";
import { usePreviewLayer } from "../preview-layer";
import { GlobalEventHandlerParameters } from "./types";
import { useGlobalEventContext } from "./GlobalEventContext";
import { useRefresh } from "../refresh";
import { useWP } from "@rnaga/wp-next-core/client/wp";

export const useGlobalEvent = () => {
  const [editor] = useLexicalComposerContext();
  const dragDrop = useDragDrop();
  const breakpoint = useBreakpoint();
  const previewLayer = usePreviewLayer();
  const globalEvent = useGlobalEventContext();
  const wp = useWP();
  const { refresh } = useRefresh();

  type ReturnTypeGetParameters<T extends Event | undefined> =
    T extends undefined
      ? Omit<GlobalEventHandlerParameters, "event">
      : GlobalEventHandlerParameters;

  const getParameters = <T extends Event | undefined>(
    event?: T,
    nodeEvent?: ReturnType<typeof useNodeEvent>
  ): ReturnTypeGetParameters<T> => {
    return (
      event
        ? {
            editor,
            nodeEvent,
            dragDrop,
            breakpoint,
            previewLayer,
            event,
            globalEvent,
            wp,
            refresh,
          }
        : {
            editor,
            nodeEvent,
            dragDrop,
            breakpoint,
            previewLayer,
            globalEvent,
            wp,
            refresh,
          }
    ) as ReturnTypeGetParameters<T>;
  };

  return { getParameters, globalEvent };
};
