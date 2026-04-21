import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from "react";
import { logger } from "../../lexical/logger";

type MessageHandler = (data: any) => void;

const Context = createContext<{
  sendMessageToParent: (message: any) => void;
  onMessageFromParent: (handler: MessageHandler) => () => void;
}>({} as any);

export const useIframeMessageContext = () => {
  const context = useContext(Context);
  return context;
};

export const IframeMessageContext = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const messageHandlersRef = useRef<Set<MessageHandler>>(new Set());

  // Function to send message to parent window
  const sendMessageToParent = useCallback((message: any) => {
    if (!window.parent) {
      logger.warn("Cannot send message: parent window not available");
      return;
    }

    // Same-host validation: only send to same origin
    const targetOrigin = window.location.origin;
    window.parent.postMessage(message, targetOrigin);
  }, []);

  // Function to register message handler
  const onMessageFromParent = useCallback((handler: MessageHandler) => {
    messageHandlersRef.current.add(handler);

    // Return cleanup function
    return () => {
      messageHandlersRef.current.delete(handler);
    };
  }, []);

  // Listen for messages from parent window
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Same-host validation: only accept messages from same origin
      if (event.origin !== window.location.origin) {
        return;
      }

      // Verify message is from parent window
      if (event.source !== window.parent) {
        return;
      }

      // Call all registered handlers
      messageHandlersRef.current.forEach((handler) => {
        handler(event.data);
      });
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <Context
      value={{
        sendMessageToParent,
        onMessageFromParent,
      }}
    >
      {children}
    </Context>
  );
};
