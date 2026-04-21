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
    zIndex: {
      layout: number;
      mousetool: number;
      mouse;
      tool: number;
    };
    layout: {
      backgroundColor: string;
    };
    leftPanel: {
      backgroundColor: string;
      borderColor?: string;
    };
    leftPanelHeader: {
      backgroundColor: string;
      borderColor?: string;
    };
    badge: {
      backgroundColor: string;
    };
    mousetoolBox: {
      borderColor: string;
      fontSize: number;
      color: string;
      backgroundColor: string;
      hover: {
        backgroundColor: string;
      };
    };
    editLayer: {
      borderColor: string;
      fontSize: number;
      color: string;
      backgroundColor: string;
      paddingColor: string;
      marginColor: string;
      hover: {
        backgroundColor: string;
        borderColor: string;
      };
    };
    resizableBox: {
      backgroundColor: string;
    };
    box: {
      borderColor: string;
      backgroundColor: string;
      hover: {
        backgroundColor: string;
      };
    };
  }
}
