import { useCallback, useEffect, useRef } from "react";
import { useIframeMessageContext } from "./IframeMessageContext";

type MessageHandler = (data: any) => void;

/**
 * Hook to handle sending and receiving messages between iframe and parent window.
 *
 * This hook provides a simple interface to communicate with the parent window
 * from within an iframe, with automatic cleanup and same-host security validation.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { sendMessage, onMessage } = useIframeMessage();
 *
 *   useEffect(() => {
 *     const unsubscribe = onMessage((data) => {
 *       appLog("log", 'Received from parent:', data);
 *     });
 *     return unsubscribe;
 *   }, [onMessage]);
 *
 *   const handleClick = () => {
 *     sendMessage({ type: 'BUTTON_CLICKED', payload: 'Hello' });
 *   };
 *
 *   return <button onClick={handleClick}>Send Message</button>;
 * }
 * ```
 */
export const useIframeMessage = () => {
  const { sendMessageToParent, onMessageFromParent } = useIframeMessageContext();

  return {
    /**
     * Send a message to the parent window.
     * Messages are only sent to the same origin for security.
     */
    sendMessage: sendMessageToParent,

    /**
     * Register a handler to receive messages from the parent window.
     * Returns an unsubscribe function to remove the handler.
     * Only messages from the same origin are processed.
     */
    onMessage: onMessageFromParent,
  };
};

/**
 * Hook to automatically handle a specific message type from the parent window.
 *
 * @param messageType - The type of message to listen for
 * @param handler - Callback function to handle the message
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   useIframeMessageListener('UPDATE_DATA', (payload) => {
 *     appLog("log", 'Update data:', payload);
 *   });
 *
 *   return <div>Listening for UPDATE_DATA messages...</div>;
 * }
 * ```
 */
export const useIframeMessageListener = (
  messageType: string,
  handler: (payload: any) => void
) => {
  const { onMessageFromParent } = useIframeMessageContext();
  const handlerRef = useRef(handler);

  // Keep handler ref up to date
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    const unsubscribe = onMessageFromParent((data: any) => {
      if (data?.type === messageType) {
        handlerRef.current(data.payload);
      }
    });

    return unsubscribe;
  }, [messageType, onMessageFromParent]);
};
