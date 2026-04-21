"use client";

import { useEffect, useState } from "react";
import { Box, Button, CircularProgress, Typography, keyframes } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { addWPHooksActionCommands } from "../event-utils";
import { useTemplate } from "../template";
import { TEMPLATE_ID_UPDATED } from "../template/commands";
import {
  PREVIEW_SELECTED_COMMAND,
  PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND,
} from "../preview-layer/commands";

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
`;

export const LoadingOverlay = () => {
  const { wpHooks } = useWP();
  const { current } = useTemplate();
  const [loading, setLoading] = useState(!current.id);
  const [visible, setVisible] = useState(!current.id);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (loading) {
      setVisible(true);
    } else if (!errorMessage) {
      const timer = setTimeout(() => setVisible(false), 400);
      return () => clearTimeout(timer);
    }
  }, [loading, errorMessage]);

  useEffect(() => {
    if (!current.id) {
      setLoading(true);
    }
  }, [current.id]);

  useEffect(() => {
    return addWPHooksActionCommands(
      wpHooks,
      [TEMPLATE_ID_UPDATED, PREVIEW_SELECTED_COMMAND],
      () => {
        setLoading(true);
        setErrorMessage(null);
      }
    );
  }, [wpHooks]);

  useEffect(() => {
    return addWPHooksActionCommands<{ error?: string }>(
      wpHooks,
      [PREWVIEW_LAYER_TEMPLATE_LOADED_COMMAND],
      (_, { error }) => {
        setLoading(false);
        if (error) {
          setErrorMessage(error);
        }
      }
    );
  }, [wpHooks]);

  if (!visible) {
    return null;
  }

  if (errorMessage) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          bgcolor: "grey.100",
          zIndex: 1299,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            maxWidth: 480,
            p: 3,
            bgcolor: "white",
            borderRadius: 2,
            border: "1px solid",
            borderColor: "error.light",
          }}
        >
          <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>
            Failed to load template
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center" }}>
            {errorMessage}
          </Typography>
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              setErrorMessage(null);
              setVisible(false);
            }}
          >
            Dismiss
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        bgcolor: "grey.100",
        zIndex: 1299,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: loading ? 1 : 0,
        transition: "opacity 0.4s ease-out",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <CircularProgress />
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            animation: `${pulse} 1.5s ease-in-out infinite`,
            ml: 1.5,
          }}
        >
          Loading...
        </Typography>
      </Box>
    </Box>
  );
};
