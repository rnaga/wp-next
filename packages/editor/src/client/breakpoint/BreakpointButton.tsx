import ComputerIcon from "@mui/icons-material/Computer";
import PhoneAndroidIcon from "@mui/icons-material/PhoneAndroid";
import TabletIcon from "@mui/icons-material/Tablet";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useBreakpoint } from "./use-breakpoint";
import { useDevice } from "./use-device";
import type * as types from "../../types";

const DEVICES: {
  device: types.BreakpointDevice;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    device: "mobile",
    label: "Mobile",
    icon: <PhoneAndroidIcon fontSize="small" />,
  },
  { device: "tablet", label: "Tablet", icon: <TabletIcon fontSize="small" /> },
  {
    device: "desktop",
    label: "Desktop",
    icon: <ComputerIcon fontSize="small" />,
  },
];

export const BreakpointButton = () => {
  const { device: selectedDevice } = useDevice();
  const { setDevice } = useBreakpoint();

  const handleClick = (device: types.BreakpointDevice) => {
    setDevice(device);
  };

  return (
    <Box sx={{ display: "flex", gap: 0.5, p: 0 }}>
      {DEVICES.map(({ device, label, icon }) => {
        const isSelected = device === selectedDevice;
        return (
          <Tooltip key={device} title={label} placement="top">
            <IconButton
              size="small"
              onClick={() => handleClick(device)}
              sx={{
                borderRadius: 1,
                backgroundColor: isSelected ? "action.selected" : "transparent",
                "&:hover": {
                  backgroundColor: isSelected
                    ? "action.selected"
                    : "action.hover",
                },
              }}
            >
              {icon}
            </IconButton>
          </Tooltip>
        );
      })}
    </Box>
  );
};
