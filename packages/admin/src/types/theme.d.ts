export {};

declare module "@mui/material/styles" {
  //   interface InputPropsSizeOverrides {
  //     xs: true;
  //   }
  interface ZIndex {
    layout: number;
    mousetool: number;
    mouse;
    tool: number;
  }
}

declare module "@rnaga/wp-next-ui/types/wp-theme.d" {
  export interface WPThemeProps {
    // text: {
    //   color: string;
    //   colorWhite: string;
    // };
    // colorScale: {
    //   100: string;
    //   200: string;
    //   300: string;
    //   400: string;
    //   500: string;
    //   600: string;
    //   700: string;
    //   800: string;
    //   900: string;
    // };
  }
}
