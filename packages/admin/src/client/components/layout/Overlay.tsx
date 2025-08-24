import React, { useEffect, useState } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Alert, Backdrop, Box, IconButton, Snackbar } from "@mui/material";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";

import { useAdminNavigation } from "../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../wp-admin";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";

export const Overlay = () => {
  const wpAdmin = useWPAdmin();
  const { wpTheme } = useWPTheme();
  const adminNavigation = useAdminNavigation();

  const {
    overlay,
    wp: { globalState, wpHooks },
  } = wpAdmin;

  const backdropState = globalState.get("overlay-backdrop");
  const snackbarState = globalState.get("overlay-snakbar");
  const confirmState = globalState.get("overlay-confirm");

  const [hooksModals, setHooksModals] = useState<React.ReactNode[]>([]);

  useEffect(() => {
    const modals = wpHooks.filter.apply("next_admin_preload_modal", [], {
      wpAdmin,
      navigation: adminNavigation,
    });

    setHooksModals(modals);
  }, []);

  return (
    <>
      {hooksModals}
      <Backdrop
        sx={{ color: "#fff", zIndex: backdropState.zIndex }}
        open={backdropState.open}
        onClick={() => {
          backdropState.onClick && backdropState.onClick();
        }}
      >
        {backdropState.component ?? <></>}
      </Backdrop>

      <Snackbar
        autoHideDuration={snackbarState.type == "error" ? undefined : 3000}
        open={snackbarState.open}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={(event, reason) => {
          if (reason === "clickaway") {
            return;
          }
          overlay.snackbar.close();
        }}
      >
        <Alert
          severity={snackbarState.type}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            justifyContent: "space-between",
            px: 2,
          }}
        >
          {snackbarState.message}

          <IconButton
            onClick={() => {
              overlay.snackbar.close();
            }}
          >
            <CloseIcon
              fontSize="small"
              sx={{
                height: 16,
                width: 16,
                mb: 0.2,
              }}
            />
          </IconButton>
        </Alert>
      </Snackbar>

      <ModalConfirm
        title={confirmState.title}
        message={confirmState.message}
        open={confirmState.isOpen}
        callback={confirmState.callback}
        onClose={() => {
          globalState.set("overlay-confirm", {
            isOpen: false,
          });
        }}
      />
    </>
  );
};
