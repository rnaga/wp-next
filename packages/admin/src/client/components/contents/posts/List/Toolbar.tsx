import { ReactNode } from "react";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Pagination } from "@rnaga/wp-next-ui/list/Pagination";
import { useWPAdmin } from "../../../../wp-admin";
import { Box } from "@mui/material";
import { InputSearch } from "@rnaga/wp-next-ui/InputSearch";

export const Toolbar = (props: {
  posts?: wpCoreTypes.actions.Posts;
  info?: wpCoreTypes.actions.PostsInfo;
  children?: ReactNode;
}) => {
  const { info, children } = props;
  const {
    wp: { viewport },
  } = useWPAdmin();

  return (
    <>
      {children}
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: viewport.isMobile ? "1fr" : "repeat(2, 1fr)",
        }}
      >
        <InputSearch size="medium" sx={{ flexGrow: 1 }} />
        <Pagination pagination={info?.pagination} />
      </Box>
    </>
  );
};
