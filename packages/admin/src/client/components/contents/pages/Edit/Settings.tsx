"use client";

import { Box } from "@mui/material";
import { Accordions } from "@rnaga/wp-next-ui/Accordions";

import {
  Discussion,
  FeaturedImage,
  PageAttributes,
  Revisions,
  Summary,
} from "../../../../components/utils/post/settings/";

export const Settings = () => {
  return (
    <Box
      sx={{
        height: "95%",
        overflowY: "auto",
      }}
    >
      <Accordions
        size="medium"
        defaultExpanded={[0]}
        items={[
          { title: "Summary", content: <Summary /> },
          { title: "Revisions", content: <Revisions /> },
          { title: "Feature Image", content: <FeaturedImage /> },
          { title: "Discussion", content: <Discussion /> },
          { title: "Page Attributes", content: <PageAttributes /> },
        ]}
      />
    </Box>
  );
};
