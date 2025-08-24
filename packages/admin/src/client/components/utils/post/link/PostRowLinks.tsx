import { Fragment } from "react";

import { SxProps } from "@mui/material";

import { Link } from "@rnaga/wp-next-ui/Link";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";

export const PostRowLinks = <
  T extends wpCoreTypes.actions.Posts[number]
>(props: {
  row: T;
  field: "categories" | "tags" | "actor";
  sx?: SxProps;
}) => {
  const { row, field, sx } = props;
  const { wpTheme } = useWPTheme();
  const { updateRouter } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"post">>();

  if (field == "actor") {
    return (
      <Link
        component="button"
        onClick={() =>
          row.author.ID && updateRouter({ author: [row.author.ID], page: 1 })
        }
        sx={sx}
      >
        <Typography
          component="span"
          sx={{
            "&:hover": {
              backgroundColor: wpTheme.text.linkHoverColor,
            },
          }}
        >
          {row.author?.display_name}
        </Typography>
      </Link>
    );
  }

  const items = field === "tags" ? row.tags : row.categories;

  return items?.map((item) => (
    <Fragment key={item.term_id}>
      <Link
        component="span"
        onClick={() => {
          item.term_id &&
            updateRouter({
              [field]: [item.term_id],
              page: 1,
            });
        }}
        sx={sx}
      >
        <Typography
          sx={{
            "&:hover": {
              backgroundColor: wpTheme.text.linkHoverColor,
            },
          }}
        >
          {item.name}
        </Typography>
      </Link>{" "}
    </Fragment>
  ));
};
