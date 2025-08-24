"use client";

import { useEffect } from "react";

import { Box, Card, CardContent, Stack } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation } from "../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../wp-admin";

export const ErrorFallback = (props: { error: { message: string } }) => {
  const {
    overlay,
    wp: {
      error: { set },
    },
  } = useWPAdmin();
  const { router, refresh } = useAdminNavigation();
  const { wpTheme } = useWPTheme();

  useEffect(() => {
    overlay.circular.close();
  }, []);

  const { error } = props;
  return (
    <>
      <Stack
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
        }}
      >
        <Card
          variant="outlined"
          color="danger"
          sx={{
            minWidth: 320,
            maxWidth: "100%",
            boxShadow: "lg",
            backgroundColor: wpTheme.background.error,
          }}
        >
          <CardContent sx={{ alignItems: "center", textAlign: "center" }}>
            <Typography size="large" bold color="error">
              Error!
            </Typography>

            <Typography size="medium" color="error">
              {error.message}
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
              <Button
                color="error"
                onClick={() => {
                  set(undefined);
                  router.back();
                }}
              >
                Go Back
              </Button>
              <Button
                color="error"
                onClick={() => {
                  set(undefined);
                  refresh(["main"]);
                }}
              >
                Try Again
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </>
  );
};
