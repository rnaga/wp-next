import { useEffect, useMemo, useRef, useState } from "react";

import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import PhotoSizeSelectSmallIcon from "@mui/icons-material/PhotoSizeSelectSmall";
import SettingsIcon from "@mui/icons-material/Settings";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import { Badge, Box, IconButton, Slider, Tooltip } from "@mui/material";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import AdjustIcon from "@mui/icons-material/Adjust";

import { BreakpointButton, useBreakpoint } from "../breakpoint";
import { useScale } from "../breakpoint/use-scale";
import { useCustomCode } from "../custom-code";
import { BasicIconMenuButton } from "../forms/components/BasicIconMenuButton";
import {
  CANVAS_SPACE_PAN_CHANGED_COMMAND,
  CANVAS_WHEEL_MODE_CHANGED_COMMAND,
  CANVAS_WHEEL_MODE_TOGGLE_COMMAND,
  WP_PREVIEW_LAYER_SCROLL_LEAVE_BOTTOM_COMMAND,
  WP_PREVIEW_LAYER_SCROLL_ON_BOTTOM_COMMAND,
} from "../mouse-tool/commands";
import { Portal } from "../portal";
import {
  getIframeHeight,
  resizeIframeHeight,
  usePreviewLayer,
} from "../preview-layer";
import { useTemplate } from "../template/use-template";

const AdjustIframeHeightMenuLabel = (props: { type: "expand" | "shrink" }) => {
  const { type } = props;

  const icon = useMemo(
    () =>
      type === "expand" ? (
        <OpenInFullIcon fontSize="small" />
      ) : (
        <CloseFullscreenIcon fontSize="small" />
      ),
    [type]
  );

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {icon}
      <Typography>{type === "expand" ? "Expand" : "Shrink"} Height</Typography>
    </Box>
  );
};

const AdjustIframeHeight = () => {
  const { iframeRef } = usePreviewLayer();
  const { wpHooks } = useWP();
  const { breakpointRef } = useBreakpoint();

  const [enable, setEnable] = useState(false);

  // TODO: reconsider if we really need to track scroll start/end for this button.
  // or we could just always show both expand/shrink buttons, or automatically adjust based on current height.
  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_PREVIEW_LAYER_SCROLL_ON_BOTTOM_COMMAND,
      (args) => {
        setEnable(true);
      }
    );
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(
      WP_PREVIEW_LAYER_SCROLL_LEAVE_BOTTOM_COMMAND,
      () => {
        setEnable(false);
      }
    );
  }, []);

  if (!enable) {
    return (
      <Tooltip title="Adjust canvas height" placement="top">
        <span>
          <IconButton disabled>
            <PhotoSizeSelectSmallIcon
              fontSize="medium"
              sx={{
                opacity: 0.5,
              }}
            />
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title="Adjust canvas height" placement="top">
      <span>
        <BasicIconMenuButton
          size="medium"
          icon={<PhotoSizeSelectSmallIcon fontSize="medium" />}
          items={[
            {
              label: <AdjustIframeHeightMenuLabel type={"expand"} />,
              value: "expand",
            },
            {
              label: <AdjustIframeHeightMenuLabel type={"shrink"} />,
              value: "shrink",
            },
          ]}
          onChange={(value) => {
            const iframe = iframeRef.current;
            if (!iframe) {
              return;
            }

            if (value === "expand") {
              const renderedHeight = parseFloat(
                getComputedStyle(iframe).height
              );
              const baseHeight =
                renderedHeight > 0
                  ? renderedHeight
                  : getIframeHeight(iframe, breakpointRef);
              if (baseHeight > 0) {
                iframe.style.height = `${baseHeight * 1.2}px`;
              }
              return;
            }

            resizeIframeHeight(iframe, breakpointRef, {
              enforceMinHeight: true,
            });
          }}
          slotProps={{
            menu: {
              anchorOrigin: {
                vertical: "top",
                horizontal: "left",
              },
              transformOrigin: {
                vertical: "bottom",
                horizontal: "left",
              },
            },
          }}
        />
      </span>
    </Tooltip>
  );
};

export const Toolbar = () => {
  const { scale, setScale } = useScale();
  const { wpTheme } = useWPTheme();
  const { previewMode } = usePreviewLayer();
  const { wpHooks } = useWP();
  const [wheelModeEnabled, setWheelModeEnabled] = useState(true);
  const [spacePanActive, setSpacePanActive] = useState(false);

  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_WHEEL_MODE_CHANGED_COMMAND,
      ({ enabled }) => {
        setWheelModeEnabled(enabled);
      }
    );
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(
      CANVAS_SPACE_PAN_CHANGED_COMMAND,
      ({ active }) => {
        setSpacePanActive(active);
      }
    );
  }, []);

  const {
    openSettingsModal,
    openJsonViewModal,
    current: currentTemplate,
  } = useTemplate();
  const { templateSetting } = useCustomCode();

  const zoomButtonRef = useRef<HTMLButtonElement>(null);
  const zoomSliderRef = useRef<HTMLDivElement>(null);

  const handleSliderMouseLeave = () => {
    setTimeout(() => {
      zoomSliderRef.current!.style.display = "none";
    }, 300);
  };

  const handleSliderMouseOver = () => {
    zoomSliderRef.current!.style.display = "block";
  };

  return (
    <>
      <Portal>
        <Box
          sx={{
            position: "fixed",
            left: "45%",
            transform: "translate(-50%)",
            bottom: 40,

            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: (theme) => theme.palette.grey[100],
            //position: "relative",
            gap: 1,
            p: 3,
            height: 40,
            zIndex: wpTheme.zIndex.layout,
          }}
        >
          <BreakpointButton />

          {previewMode !== "fullscreen" && (
            <Tooltip
              title={
                wheelModeEnabled
                  ? "Pan mode: on — click to disable"
                  : "Pan mode: off — click to enable"
              }
              placement="top"
            >
              <Badge variant="dot" color="error" invisible={!spacePanActive}>
                <IconButton
                  size="small"
                  onClick={() => {
                    wpHooks.action.doCommand(
                      CANVAS_WHEEL_MODE_TOGGLE_COMMAND,
                      {}
                    );
                  }}
                  sx={{
                    width: 35,
                    height: 35,
                    p: "5px",
                    color: wheelModeEnabled ? "primary.main" : "action.active",
                    backgroundColor: wheelModeEnabled
                      ? (theme) => `${theme.palette.primary.main}18`
                      : undefined,
                    "&:hover": {
                      backgroundColor: wheelModeEnabled
                        ? (theme) => `${theme.palette.primary.main}30`
                        : undefined,
                    },
                    borderRadius: 100,
                  }}
                >
                  <AdjustIcon fontSize="small" />
                </IconButton>
              </Badge>
            </Tooltip>
          )}

          <IconButton
            ref={zoomButtonRef}
            //onMouseLeave={handleSliderMouseLeave}
            onClick={() => {
              if (zoomSliderRef.current?.style.display === "block") {
                zoomSliderRef.current!.style.display = "none";
                return;
              }

              const buttonRect = zoomButtonRef.current?.getBoundingClientRect();
              // Set the position of the slider based on the button position

              if (buttonRect && zoomSliderRef.current) {
                zoomSliderRef.current.style.left = `${
                  buttonRect.left + buttonRect.width / 2 - 15
                }px`;
                zoomSliderRef.current.style.top = `${buttonRect.top - 150}px`;
                zoomSliderRef.current.style.display = "block";
              }
            }}
            sx={{
              borderRadius: 1,
              px: 3.5,
              width: 35,
              height: 35,
              backgroundColor: (theme) => theme.palette.grey[100],
            }}
          >
            <ZoomInIcon />
            <Typography
              sx={{
                fontSize: 10,
              }}
            >{`${parseInt(`${scale * 100}`)}%`}</Typography>
          </IconButton>

          <BasicIconMenuButton
            icon={<SettingsIcon />}
            items={[
              { label: "JSON Editor", value: "json-editor" },
              { label: "Custom Code", value: "custom-code" },
              { label: "Settings", value: "settings" },
            ]}
            onChange={(value) => {
              if (value === "json-editor") {
                openJsonViewModal();
              } else if (value === "custom-code") {
                templateSetting.openModal();
              } else if (value === "settings") {
                openSettingsModal();
              }
            }}
            slotProps={{
              menu: {
                anchorOrigin: {
                  vertical: "top",
                  horizontal: "left",
                },
                transformOrigin: {
                  vertical: "bottom",
                  horizontal: "left",
                },
              },
            }}
          />
        </Box>
      </Portal>

      <Portal>
        <Box
          ref={zoomSliderRef}
          sx={{
            position: "fixed",
            width: 30,
            height: 150,
            backgroundColor: (theme) => theme.palette.grey[100],
            py: 2,
            zIndex: wpTheme.zIndex.layout + 1,
            display: "none",
            borderRadius: 1,
          }}
          component={"div"}
          onMouseLeave={handleSliderMouseLeave}
          onMouseOver={handleSliderMouseOver}
        >
          <Slider
            orientation="vertical"
            size="small"
            value={parseInt(`${scale * 100}`)}
            onChange={(e, v) => {
              setScale((v as number) / 100);
            }}
            getAriaValueText={(value) => {
              return `${value}%`;
            }}
            onMouseLeave={handleSliderMouseLeave}
            onMouseOver={handleSliderMouseOver}
            min={30}
            max={200}
            sx={{
              zIndex: wpTheme.zIndex.layout,
            }}
          />
        </Box>
      </Portal>
    </>
  );
};
