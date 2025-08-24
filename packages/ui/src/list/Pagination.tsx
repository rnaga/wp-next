import { Box, Pagination as MuiPagination } from "@mui/material";
import { Typography } from "../Typography";
import { Viewport } from "../Viewport";

import type * as wpTypes from "@rnaga/wp-node/types";
import { useNavigation } from "@rnaga/wp-next-core/client/hooks/use-navigation";
export const Pagination = (props: { pagination?: wpTypes.crud.Pagination }) => {
  const { pagination } = props;
  const { queryObject, updateRouter } = useNavigation();

  if (!pagination) {
    return null;
  }

  const total = pagination?.totalPage ?? 0;
  const count = pagination.count ?? 0;
  const page = !queryObject.page ? 1 : parseInt(queryObject.page?.toString());

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        gap: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        [theme.breakpoints.down("md")]: {
          justifyContent: "center",
        },
      })}
    >
      <Viewport device="desktop">
        <Typography bold>{count} items</Typography>
      </Viewport>
      <Box sx={{ maxHeight: 30 }}>
        <MuiPagination
          page={page}
          count={total}
          siblingCount={0}
          onChange={(e, page) => updateRouter({ page })}
          variant="outlined"
          shape="rounded"
        />
      </Box>
    </Box>
  );
};
