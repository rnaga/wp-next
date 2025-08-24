import type { WPTheme } from "../types";

export const wpTheme: WPTheme = {
  global: {
    text: {
      color: "#000", // black text for light theme
      colorWhite: "#000", // white text for dark theme
      linkHoverColor: "rgba(0, 0, 0, 0.04)", // blue color for link hover
    },

    colors: {
      primary: "#0073aa", // blue
      secondary: "#005177", // dark blue
      tertiary: "#004166", // darker blue
      success: "#28a745", // green
      warning: "#ffc107", // yellow
      danger: "#dc3545", // red
      error: "#dc3545", // red
      info: "#17a2b8", // cyan
    },
    colorScale: {
      100: "#ffffff", // pure white
      200: "#d9d9d9",
      300: "#b3b3b3",
      400: "#8c8c8c",
      500: "#666666",
      600: "#404040",
      700: "#1a1a1a",
      800: "#0d0d0d",
      900: "#000000", // pure black
    },
    background: {
      color: "#fff", // dark background
      error: "#f8d7da", // light red for error background
      hoverColor: "#f5f5f5", // light gray for hover
    },
    border: {
      color: "rgb(189, 189, 189)", // gray border
    },
    table: {
      header: {
        backgroundColor: "#dbdadaff", //"rgba(54, 45, 45, 1)", // dark background for table header
        color: "rgba(0, 0, 0, 1)", // white text for table header
      },
    },
  },
  dark: {
    text: {
      color: "#fff", // white text for dark theme
      colorWhite: "#fff", // black text for light theme
      linkHoverColor: "rgba(248, 244, 244, 0.45)", // white color for link hover
    },
    colors: {
      primary: "#0073aa", // blue
      secondary: "#005177", // dark blue
      tertiary: "#004166", // darker blue
      success: "#28a745", // green
      warning: "#ffc107", // yellow
      danger: "#dc3545", // red
      error: "#dc3545", // red
      info: "#17a2b8", // cyan
    },
    colorScale: {
      100: "#000000", // lightest in dark mode
      200: "#0d0d0d",
      300: "#1a1a1a",
      400: "#404040",
      500: "#666666",
      600: "#8c8c8c",
      700: "#b3b3b3",
      800: "#d9d9d9",
      900: "#ffffff", // darkest in dark mode
    },
    background: {
      color: "#0d0d0d", // dark background
      error: "#f8d7da", // light red for error background
      hoverColor: "#1a1a1a", // slightly lighter for hover
    },
    border: {
      color: "rgb(189, 189, 189", // gray border
    },
    table: {
      header: {
        backgroundColor: "rgba(10, 10, 10, 1)", // light background for table header
        color: "rgba(255, 255, 255, 1)", // black text for table header
      },
    },
  },
};
