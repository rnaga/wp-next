"use client";

import { Accordions } from "@rnaga/wp-next-ui/Accordions";
import {
  Categories,
  Discussion,
  Excerpt,
  FeaturedImage,
  Revisions,
  Summary,
  Tags,
} from "../../../../components/utils/post/settings/";
import { Box } from "@mui/material";

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
          { title: "Categories", content: <Categories /> },
          { title: "Tags", content: <Tags /> },
          { title: "Feature Image", content: <FeaturedImage /> },
          { title: "Excerpt", content: <Excerpt /> },
          { title: "Discussion", content: <Discussion /> },
        ]}
      />
    </Box>
  );
};
