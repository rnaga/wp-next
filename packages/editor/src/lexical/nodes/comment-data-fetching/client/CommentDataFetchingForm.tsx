import { useCallback, useMemo } from "react";

import { Checkmarks, CheckmarksItem } from "@rnaga/wp-next-ui/Checkmarks";
import { SelectWPPost } from "@rnaga/wp-next-ui/SelectWPPost";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { FormControl } from "../../../../client/forms/components";
import { useDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";
import {
  ALLOWED_QUERY_PASSTHROUGH_KEYS,
  CommentDataFetchingNode,
} from "../CommentDataFetchingNode";

import { Input } from "@rnaga/wp-next-ui/Input";

export const CommentDataFetchingForm = () => {
  const { currentNode, query, updateQuery, updateAllowedQueryPassthroughKeys } =
    useDataFetchingForm<CommentDataFetchingNode>();

  const commentId = useMemo(() => {
    return currentNode?.getQuery().ID ?? query?.ID;
  }, [currentNode, query]);

  const allowedQueryKeys = useMemo(() => {
    return currentNode?.__allowedQueryPassthroughKeys ?? [];
  }, [currentNode]);

  const checkmarkItems: CheckmarksItem[] = useMemo(
    () =>
      ALLOWED_QUERY_PASSTHROUGH_KEYS.map((key) => ({
        label: key,
        value: key,
      })),
    []
  );

  const handleAllowedKeysChange = (values: string[]) => {
    updateAllowedQueryPassthroughKeys(currentNode, values);
  };

  return useCallback(
    () => (
      <>
        <FormControl label="Comment">
          <Input
            type="number"
            size="medium"
            value={commentId ?? ""}
            onChange={(value) => {
              if (value === "") {
                return;
              }
              updateQuery({
                ID: parseInt(value, 10),
              });
            }}
            placeholder="Enter Comment ID"
          />
        </FormControl>
        <FormControl label="Allowed Query Passthrough Keys">
          <Checkmarks
            items={checkmarkItems}
            values={allowedQueryKeys}
            onChange={handleAllowedKeysChange}
            size="medium"
            label="Select query keys"
            sx={{ width: "100%" }}
          />
          <Typography
            size="small"
            sx={{ mt: 0.5, opacity: 0.7, fontStyle: "italic" }}
          >
            Select which query parameters can be passed through from the URL.
          </Typography>
        </FormControl>
      </>
    ),
    [commentId]
  )();
};
