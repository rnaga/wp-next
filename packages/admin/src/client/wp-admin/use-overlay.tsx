"use client";
import "reflect-metadata";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import type * as types from "../../types";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";

export const useOverlayState = (props: {
  globalState: wpCoreTypes.client.WP["globalState"];
}) => {
  const { globalState } = props;
  const overlayBackDrop = globalState.get("overlay-backdrop");

  const [openCircular, setOpenCircular] = useState(false);

  useEffect(() => {
    openCircular ? circular.open() : circular.close();
  }, [openCircular]);

  const backdrop = {
    open: (
      args: Partial<{
        component: React.ReactNode;
        onClick: () => void;
        zIndex: number;
      }>
    ) => {
      globalState.set({
        "overlay-backdrop": {
          open: true,
          component: args?.component,
          onClick: args?.onClick,
          zIndex: args?.zIndex ?? 1,
        },
      });
    },
    close: () =>
      globalState.set({
        "overlay-backdrop": { ...overlayBackDrop, open: false },
      }),
  };

  const circular = {
    open: () => {
      backdrop.open({
        component: <CircularProgress />,
        zIndex: 10,
      });
    },
    close: () => {
      backdrop.close();
    },
    promise: async <T,>(fn: Promise<T>) => {
      circular.open();
      const result = await fn;
      circular.close();

      return result;
    },
  };

  const snackbar = {
    open: (type: types.client.SnackBarType, message: string) => {
      globalState.set({
        "overlay-snakbar": {
          type,
          open: true,
          message,
        },
      });
    },
    close: () => {
      globalState.set({
        "overlay-snakbar": {
          type: "primary",
          open: false,
          message: "",
        },
      });
    },
  };

  const confirm = {
    open: (
      message: string | React.ReactNode,
      callback: (confirm: boolean) => void,
      title?: string
    ) => {
      const wrapperCallback = (confirm: boolean) => {
        callback(confirm);
        globalState.set({
          "overlay-confirm": {
            isOpen: false,
            title: "",
            message: "",
            callback: (confirm: boolean) => {},
          },
        });
      };
      globalState.set({
        "overlay-confirm": {
          isOpen: true,
          title: title ?? "",
          message,
          callback: wrapperCallback,
        },
      });
    },
  };

  return { backdrop, circular, snackbar, confirm };
};
