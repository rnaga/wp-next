import { useMediaQuery } from "@mui/material";

export const useViewport = () => {
  const isUpMd = useMediaQuery((theme: any) => theme?.breakpoints.up("md"));
  const viewport = {
    isMobile: !isUpMd,
    isDesktop: isUpMd,
  };
  return viewport;
};
