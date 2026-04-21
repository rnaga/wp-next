import { Box } from "@mui/material";

import { StyleClassSelector } from "../../../../../client/right-panel-form/style/StyleClassSelector";
import { StyleLayout } from "../../../../../client/right-panel-form/style/layout/StyleLayout";
import { StyleSize } from "../../../../../client/right-panel-form/style/StyleSize";
import { StyleSpacing } from "../../../../../client/right-panel-form/style/spacing/StyleSpacing";
import { StylePosition } from "../../../../../client/right-panel-form/style/position/StylePosition";
import { Accordions } from "@rnaga/wp-next-ui/Accordions";
import { StyleFormContext } from "../../../../../client/right-panel-form/style/StyleFormContext";
import { StyleTypography } from "../../../../../client/right-panel-form/style/typography/StyleTypography";
import { StyleGridCellSize } from "./StyleGridCellSize";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { StyleBackground } from "../../../../../client/right-panel-form/style/background/StyleBackground";
import { StyleBoxSurface } from "../../../../../client/right-panel-form/style/box-surface/StyleBoxSurface";
import { StyleTransitions } from "../../../../../client/right-panel-form/style/transition/StyleTransitions";
import { StyleCustomProperties } from "../../../../../client/right-panel-form/style/custom-properties/StyleCustomProperties";

export const StyleFormGridCell = () => {
  const { wpTheme } = useWPTheme();
  return (
    <StyleFormContext>
      <Box
        sx={{
          mb: 20,
          zIndex: wpTheme.zIndex.layout + 1,
        }}
      >
        <Accordions
          size="medium"
          items={[
            { title: "Class Selectors", content: <StyleClassSelector /> },
            { title: "Custom Properties", content: <StyleCustomProperties /> },
            { title: "Grid Cell Size", content: <StyleGridCellSize /> },
            { title: "Spacing", content: <StyleSpacing /> },
            { title: "Size", content: <StyleSize /> },
            { title: "Position", content: <StylePosition /> },
            { title: "Typography", content: <StyleTypography /> },
            { title: "Background", content: <StyleBackground /> },
            { title: "Box Surface", content: <StyleBoxSurface /> },
            {
              title: "Transitions",
              content: <StyleTransitions />,
            },
          ]}
        />
      </Box>
    </StyleFormContext>
  );
};
