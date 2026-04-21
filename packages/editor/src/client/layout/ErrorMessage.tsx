import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useEffect, useRef, useState } from "react";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import {
  WP_DRAG_END_COMMAND,
  WP_DRAG_END_WITH_ERROR_COMMAND,
  WP_DRAG_ON_SUCCESS_COMMAND,
  WP_DRAG_OUT_WITH_ERROR_COMMAND,
} from "../drag-drop/commands";

export const ErrorMessage = () => {
  const { wpHooks } = useWP();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const errorIsSetRef = useRef(false);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cancelAutoHide = () => {
      if (hideTimeoutRef.current && !errorIsSetRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };

    const clearError = () => {
      if (!errorIsSetRef.current) {
        setErrorMessage(null);
      }
    };

    const unsubscribeError = wpHooks.action.addCommand(
      WP_DRAG_OUT_WITH_ERROR_COMMAND,
      ({ error }) => {
        cancelAutoHide();
        setErrorMessage(error);
      }
    );

    const unsubscribeSuccess = wpHooks.action.addCommand(
      WP_DRAG_ON_SUCCESS_COMMAND,
      () => {
        cancelAutoHide();
        clearError();
      }
    );

    const unsubscribeDragEnd = wpHooks.action.addCommand(
      WP_DRAG_END_COMMAND,
      () => {
        cancelAutoHide();
        clearError();
      }
    );

    const unsubscribeErrorDragEnd = wpHooks.action.addCommand(
      WP_DRAG_END_WITH_ERROR_COMMAND,
      ({ error }) => {
        errorIsSetRef.current = true;
        cancelAutoHide();
        setErrorMessage(error);
        hideTimeoutRef.current = setTimeout(() => {
          errorIsSetRef.current = false;
          setErrorMessage(null);
          hideTimeoutRef.current = null;
        }, 3000);
      }
    );

    return () => {
      cancelAutoHide();
      unsubscribeError();
      unsubscribeSuccess();
      unsubscribeDragEnd();
      unsubscribeErrorDragEnd();
    };
  }, [wpHooks]);

  if (!errorMessage) {
    return null;
  }

  return (
    <Typography
      size="small"
      sx={{
        backgroundColor: "rgba(251, 52, 52, 0.8)",
        border: "1px solid red",
        color: "white",
        p: 1,
      }}
    >
      {errorMessage}
    </Typography>
  );
};
