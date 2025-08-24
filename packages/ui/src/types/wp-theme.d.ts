export interface WPThemeNamespace {
  global: true;
  dark: true;
}

export interface WPThemeProps {
  text: {
    color: string;
    colorWhite: string;
    linkHoverColor: string;
  };
  background: {
    color: string;
    error: string;
    hoverColor: string;
  };
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    success: string;
    warning: string;
    danger: string;
    error: string;
    info: string;
  };
  colorScale: {
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  border: {
    color: string;
  };
  table: {
    header: {
      backgroundColor: string;
      color: string;
    };
  };
}

export type WPTheme = Record<keyof WPThemeNamespace, WPThemeProps>;
