"use client";

import { useMemo } from "react";

import { Box } from "@mui/material";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useCurrentMenu } from "../../hooks/use-current-menu";

export const Title = () => {
  const menu = useCurrentMenu();
  const title = useMemo(() => menu && menu[0]?.label, [menu]);
  return (
    <>
      <Box
        sx={{
          display: "flex",
          mb: 1,
          gap: 1,
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "start", sm: "center" },
          flexWrap: "wrap",
          justifyContent: "space-between",
        }}
      >
        <Typography size="xlarge" bold>
          {title}
        </Typography>
      </Box>
    </>
  );
};
