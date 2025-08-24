"use client";
import { useCallback, useEffect, useState, useTransition } from "react";

import { Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { SortableTh, Table, Td, Th, THead, Tr } from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";

import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { Row } from "./Row";
import { Toolbar } from "./Toolbar";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import type * as wpTypes from "@rnaga/wp-node/types";

export type Comment =
  | wpTypes.Tables["comments"]
  | wpCoreTypes.actions.Comments[number];

export const List = () => {
  const { actions, parse } = useServerActions();

  const [loading, startTransition] = useTransition();
  const [{ comments, info }, setComments] = useState<{
    comments: wpCoreTypes.actions.Comments | undefined;
    info: wpCoreTypes.actions.CommentsInfo | undefined;
  }>({
    comments: undefined,
    info: undefined,
  });

  const { navigationStatus, queryObject, refresh, refreshValue } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"comment">>();

  const fetchComments = useCallback(async () => {
    const [comments, info] = await actions.comment
      .list({ parent: [0], ...queryObject })
      .then(parse);

    setComments({ comments, info });
  }, [navigationStatus, refreshValue().content]);

  useEffect(() => {
    startTransition(fetchComments);
  }, [navigationStatus]);

  useEffect(() => {
    fetchComments();
  }, [refreshValue().content]);

  return (
    <Stack spacing={1}>
      <Toolbar comments={comments} info={info} />
      <Loading loading={loading}>
        <Table>
          <THead>
            <SortableTh
              name="Author"
              orderby="comment_author"
              style={{
                width: "20%",
              }}
            />
            <Th viewport="desktop" style={{ width: "40%" }}>
              Comment
            </Th>
            <Th
              viewport="desktop"
              style={{
                width: "20%",
              }}
            >
              In Response To
            </Th>
            <SortableTh
              name="Submitted on"
              orderby="comment_date"
              viewport="desktop"
              style={{
                width: "20%",
              }}
            />
          </THead>
          <tbody>
            {comments?.map((comment) => (
              <Tr key={`${comment.comment_ID}`}>
                <Td colSpan={4}>
                  <Row comment={comment} />
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Loading>
    </Stack>
  );
};
