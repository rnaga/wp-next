"use client";
import "diff2html/bundles/css/diff2html.min.css";
import "./diff2html.css";

import * as Diff from "diff";
import * as Diff2html from "diff2html";
import { ColorSchemeType } from "diff2html/lib/types";
import parseHtml from "html-react-parser";
import { useEffect, useState, useTransition } from "react";
import { z } from "zod";

import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Box, Link, Stepper, Switch, useColorScheme } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { Loading } from "@rnaga/wp-next-ui/Loading";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";
import { History } from "./History";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export type SelectedRevision = {
  index: number;
  target?: wpCoreTypes.actions.Revisions[number];
};

export const List = () => {
  const {
    overlay,
    wp: { error, viewport },
  } = useWPAdmin();
  const { actions, parse, safeParse } = useServerActions();
  const { searchParams, navigationStatus, queryObject, goto, resolvePath } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"revision">>();

  const { mode } = useColorScheme();

  const [loading, startTransition] = useTransition();

  const [state, setState] = useState<{
    diffHtml?: string;
    sideBySide: boolean;
    compareWithParent: boolean;
    parent?: wpCoreTypes.actions.Post;
    revisions?: wpCoreTypes.actions.Revisions;
    canRestore: boolean;
    selectedRevision?: SelectedRevision;
    editUrl?: string;
  }>({
    canRestore: false,
    sideBySide: false,
    compareWithParent: false,
  });

  const {
    parent,
    sideBySide,
    selectedRevision,
    diffHtml,
    canRestore,
    compareWithParent,
    revisions,
    editUrl,
  } = state;

  const parentId = z
    .string()
    .transform((v) => parseInt(v))
    .parse(searchParams.get("id"));

  if (0 >= parentId) {
    error.throw("Invalid Parent Id");
  }

  useEffect(() => {
    if (!selectedRevision) {
      return;
    }

    const { index, target } = selectedRevision;

    if (!target) {
      return;
    }

    const parentOrPrevious = compareWithParent
      ? parent
      : revisions && revisions?.length > index + 1
      ? revisions[index + 1]
      : undefined;

    const diff = Diff.createTwoFilesPatch(
      parentOrPrevious?.post_title ?? " ",
      target.post_title,
      parentOrPrevious?.post_content ?? " ",
      target.post_content
    );

    const diffJson = Diff2html.parse(diff);
    const diffHtml = Diff2html.html(diffJson, {
      //drawFileList: true,
      outputFormat: sideBySide ? "side-by-side" : "line-by-line",
      rawTemplates: { "file-summary-wrapper": "" },
      colorScheme: mode == "dark" ? ColorSchemeType.DARK : ColorSchemeType.AUTO,
    });

    setState({ ...state, diffHtml });
  }, [selectedRevision, sideBySide, compareWithParent, mode]);

  useEffect(() => {
    startTransition(async () => {
      //const fetchData = async () => {
      const [revisions] = await actions.revision
        .list(parentId, { ...queryObject, per_page: 30 })
        .then(parse);

      if (parent) {
        setState({ ...state, revisions });
        return;
      }
      const [post] = await actions.post.get(parentId).then(parse);

      setState({
        ...state,
        ...{
          editUrl: resolvePath("blog", {
            append: "/posts/edit",
            queryParams: {
              id: post.ID,
            },
          }),
          revisions,
          parent: post,
          selectedRevision: {
            index: 0,
            target: revisions[0],
          },
        },
      });
    });
  }, [navigationStatus]);

  const handleSelectRevision = (revision?: SelectedRevision) => {
    setState({
      ...state,
      ...{
        canRestore: revision && revision?.index > 0 ? true : false,
        selectedRevision: revision,
      },
    });
  };

  const handleRestore = async () => {
    if (!selectedRevision?.target) {
      return;
    }

    const restoreId = selectedRevision.target.ID;

    const result = await overlay.circular
      .promise(actions.revision.restore(parentId, restoreId))
      .then(safeParse);

    if (result.success && editUrl) {
      goto(editUrl);
    }
  };

  return (
    <>
      {!loading && (
        <Link
          sx={{
            mt: 1,
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            textDecoration: "none",
          }}
          onClick={() => {
            editUrl && goto(editUrl);
          }}
        >
          <ArrowBackIcon fontSize="small" />
          <Typography size="medium">Go to editor</Typography>
        </Link>
      )}
      <Loading loading={loading}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(80vw, auto)",
              md: "15vw minmax(60vw, auto)",
            },
            maxWidth: "100vw",
            verticalAlign: "top",
          }}
        >
          <Box sx={{ maxHeight: "75dvh", overflow: "auto" }}>
            <Stepper
              orientation={viewport.isDesktop ? "vertical" : "horizontal"}
              sx={{ maxWidth: "80vw" }}
            >
              <History revisions={revisions} onClick={handleSelectRevision} />
            </Stepper>
          </Box>
          <Box>
            <Box
              sx={{
                display: "flex",
                width: "100%",
                justifyContent: "flex-start",
                my: 1,
                gap: 1,
              }}
            >
              <Box sx={{ flexGrow: 1 }}>
                <Button
                  size="medium"
                  disabled={!canRestore}
                  onClick={handleRestore}
                >
                  Restore This Revision
                </Button>
              </Box>
              <Typography
                component="span"
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Compare with Parent
                <Switch
                  onChange={(e) =>
                    setState({
                      ...state,
                      compareWithParent: e.target.checked,
                    })
                  }
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography
                component="span"
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                Side by Side
                <Switch
                  onChange={(e) =>
                    setState({ ...state, sideBySide: e.target.checked })
                  }
                  sx={{ ml: 1 }}
                />
              </Typography>
            </Box>
            {diffHtml && parseHtml(diffHtml)}
          </Box>
        </Box>
      </Loading>
    </>
  );
};
