"use client";
import * as React from "react";

import {
  ThemeProvider as MuiThemeProvider,
  createTheme as createMuiTheme,
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  extendTheme as materialExtendTheme,
  THEME_ID as MATERIAL_THEME_ID,
  useColorScheme as useMaterialColorScheme,
  useTheme,
} from "@mui/material/styles";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { wpTheme } from "./wp-theme";

import type * as types from "./types";
import { CssBaseline } from "@mui/material";
const WPThemeContext = React.createContext<types.WPTheme>(wpTheme);

export const useWPTheme = () => {
  const theme = React.useContext(WPThemeContext);
  const { mode } = useMaterialColorScheme();
  const muiTheme = useTheme();

  const wpTheme = mode === "dark" ? theme.dark : theme.global;

  return {
    mode,
    wpTheme,
    muiTheme,
    wpRawTheme: theme,
  };
};

export const baseMaterialTheme = [];

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const { wpHooks } = useWP();
  const initWPTheme = React.useContext(WPThemeContext);

  const themes = wpHooks.filter.apply("next_ui_theme", {
    mui: baseMaterialTheme,
    wp: initWPTheme,
  });

  const muiThemeWithOverrides = createMuiTheme({
    colorSchemes: {
      dark: true,
    },
  });
  const wpTheme = themes.wp;

  return (
    <MaterialCssVarsProvider
      theme={{ [MATERIAL_THEME_ID]: muiThemeWithOverrides }}
    >
      <MuiThemeProvider theme={muiThemeWithOverrides}>
        <WPThemeContext value={wpTheme}>
          <CssBaseline />
          {children}
        </WPThemeContext>
      </MuiThemeProvider>
    </MaterialCssVarsProvider>
  );
}
