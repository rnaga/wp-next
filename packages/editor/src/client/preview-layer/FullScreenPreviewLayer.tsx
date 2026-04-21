import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useTemplate } from "../template";
import { usePreviewLayer } from "./preview-layer";
import { useEffect, useRef } from "react";
import { FULLSCREEN_PREVIEW_LAYER_LOADED_COMMAND } from "./commands";
import { WP_BREAKPOINT_CHANGED_COMMAND } from "../breakpoint/commands";
import { CANVAS_ZOOMING_COMMAND } from "../mouse-tool/commands";

export const FullScreenPreviewLayer = () => {
  const { current: currentTemplate } = useTemplate();
  const { fullscreenIframeRef, previewMode, updatePreviewIframeOffset } =
    usePreviewLayer();
  const { wpHooks } = useWP();
  const isIframeLoaded = useRef(false);

  useEffect(() => {
    return wpHooks.action.addCommand(WP_BREAKPOINT_CHANGED_COMMAND, () => {
      updatePreviewIframeOffset(fullscreenIframeRef.current, {
        fullscreen: true,
      });
    });
  }, [fullscreenIframeRef.current?.contentDocument?.body]);

  useEffect(() => {
    return wpHooks.action.addCommand(
      FULLSCREEN_PREVIEW_LAYER_LOADED_COMMAND,
      () => {
        if (isIframeLoaded.current) {
          updatePreviewIframeOffset(fullscreenIframeRef.current, {
            fullscreen: true,
          });
        }
      }
    );
  }, []);

  if (!currentTemplate || !currentTemplate.id) {
    return null;
  }

  return (
    <iframe
      style={{
        backgroundColor: "white",
        visibility: previewMode === "fullscreen" ? "visible" : "hidden",
        overflowY: "auto",
      }}
      ref={(ref: HTMLIFrameElement) => {
        if (!ref) {
          return;
        }

        fullscreenIframeRef.current = ref;
        isIframeLoaded.current = false;

        const observer = new MutationObserver((mutations) => {
          if (ref.contentDocument?.readyState === "complete") {
            wpHooks.action.doCommand(FULLSCREEN_PREVIEW_LAYER_LOADED_COMMAND, {
              iframeWindow: ref.contentWindow!,
              iframe: ref,
            });

            // Disable scrolling in iframe
            //ref.contentDocument!.documentElement.style.overflow = "hidden";

            // Attach zoom listener to the iframe's own document so ctrl+wheel
            // events (which fire inside the iframe and don't bubble to the
            // parent document) still trigger our zoom and block browser zoom.
            // Guarded by isIframeLoaded to add the listener exactly once per
            // iframe mount.
            if (!isIframeLoaded.current && ref.contentWindow) {
              ref.contentWindow.addEventListener(
                "wheel",
                (event: WheelEvent) => {
                  if (!(event.ctrlKey || event.deltaZ !== 0)) return;
                  event.preventDefault();
                  const direction = event.deltaZ > 0 ? "in" : "out";
                  wpHooks.action.doCommand(CANVAS_ZOOMING_COMMAND, {
                    event,
                    direction,
                  });
                },
                { passive: false }
              );
            }

            isIframeLoaded.current = true;

            //observer.disconnect();
            return;
          }
        });

        // Observe both the entire document and specifically the head element
        observer.observe(ref.contentDocument!, {
          childList: true,
          subtree: true,
          attributes: true,
          characterData: true,
        });
      }}
      src={`preview?id=${currentTemplate?.id}`}
    />
  );
};
