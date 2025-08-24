import { useEffect, useState, useTransition } from "react";

import { Box, Grid, LinearProgress, Pagination } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { CardImage } from "../CardImage";
import { InputSearch } from "../InputSearch";
import { Typography } from "../Typography";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { useWP } from "@rnaga/wp-next-core/client/wp";

export const MediaSelectorList = () => {
  const { viewport, globalState } = useWP();
  const { actions, parse } = useServerActions();
  const mimeTypes = globalState.get("media-selector-modal")?.mimeTypes;

  const [loading, startTransition] = useTransition();

  const [query, setQuery] = useState<Record<string, any>>({});
  const [{ posts, info }, setPosts] = useState<{
    posts: wpCoreTypes.actions.Posts | undefined;
    info: wpCoreTypes.actions.PostsInfo | undefined;
  }>({
    posts: undefined,
    info: undefined,
  });
  useEffect(() => {
    startTransition(async () => {
      const [posts, info] = await actions.post
        .list(
          { ...query, status: ["inherit"], per_page: 20 },
          { postTypes: ["attachment"], mimeTypes }
        )
        .then(parse);

      setPosts({ posts, info });
    });
  }, [query]);

  return (
    <>
      <Box sx={{ my: 2 }}>
        <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
          <InputSearch
            size="medium"
            sx={{ flexGrow: viewport.isMobile ? 1 : 0 }}
            onChange={(value) => setQuery({ ...query, search: value, page: 1 })}
          />
          <Pagination
            page={parseInt(query.page?.toString() ?? "1")}
            count={info?.pagination?.totalPage ?? 0}
            siblingCount={0}
            onChange={(e, page) => setQuery({ ...query, page })}
            variant="outlined"
            shape="rounded"
          />
        </Box>
      </Box>

      <Grid container spacing={1} columns={{ xs: 2, sm: 12, md: 12, xl: 12 }}>
        {loading ? (
          <Box
            sx={{
              pt: 10,
              width: "100%",
              display: "grid",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography>Loading...</Typography>
            <LinearProgress />
          </Box>
        ) : (
          posts?.map((post) => (
            <Grid key={post.ID} size={{ xs: 1, sm: 4, md: 3, xl: 2 }} gap={0}>
              <Box>
                <CardImage
                  src={post.guid}
                  alt={post.post_title}
                  sx={{
                    width: "100%",
                    maxHeight: 150,
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    globalState.set({
                      "media-target-item": { post },
                      "media-selector-preview": { open: true },
                    });
                  }}
                />
              </Box>
            </Grid>
          ))
        )}
      </Grid>
    </>
  );
};
