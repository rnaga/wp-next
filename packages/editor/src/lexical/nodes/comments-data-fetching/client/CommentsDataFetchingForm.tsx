import { useMemo } from "react";

import { Checkmarks, CheckmarksItem } from "@rnaga/wp-next-ui/Checkmarks";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { FormControl } from "../../../../client/forms/components";
import { useDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";
import {
  ALLOWED_QUERY_PASSTHROUGH_KEYS,
  CommentsDataFetchingNode,
} from "../CommentsDataFetchingNode";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "All", value: "" },
  { label: "Approved", value: "approve" },
  { label: "Pending", value: "hold" },
  { label: "Spam", value: "spam" },
  { label: "Trash", value: "trash" },
];

const ORDER_OPTIONS: { label: string; value: string }[] = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

const ORDERBY_OPTIONS: { label: string; value: string }[] = [
  { label: "Date", value: "comment_date_gmt" },
  { label: "Comment ID", value: "comment_ID" },
  { label: "Parent", value: "comment_parent" },
  { label: "Post ID", value: "comment_post_ID" },
  { label: "Author", value: "comment_author" },
  { label: "Type", value: "comment_type" },
];

export const CommentsDataFetchingForm = () => {
  const [editor] = useLexicalComposerContext();
  const { currentNode, query, updateQuery, updateAllowedQueryPassthroughKeys } =
    useDataFetchingForm<CommentsDataFetchingNode>();

  const { post, postSlug, status, search, order, orderby } = useMemo(() => {
    const nodeQuery = editor.read(() => currentNode?.getQuery());

    return {
      post: query?.post || nodeQuery?.post,
      postSlug: query?.post_slug || nodeQuery?.post_slug,
      status: nodeQuery?.status ?? query?.status,
      search: nodeQuery?.search ?? query?.search,
      order: nodeQuery?.order ?? query?.order,
      orderby: nodeQuery?.orderby ?? query?.orderby,
    };
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

  return (
    <>
      <FormControl label="Search">
        <Input
          sx={{ display: "block" }}
          size="medium"
          value={search?.toString() ?? ""}
          onChange={(value) => updateQuery("search", value)}
        />
      </FormControl>
      <FormControl label="Post Slug">
        <InputMultiple
          size="medium"
          value={postSlug || []}
          onChange={(values) => updateQuery({ post_slug: values })}
        />
        <Typography
          size="small"
          sx={{ mt: 0.5, opacity: 0.7, fontStyle: "italic" }}
        >
          Filter comments by Post Slug.
        </Typography>
      </FormControl>
      <FormControl label="Post ID">
        <InputMultiple
          size="medium"
          value={(post || []).map((v) => `${v}`)}
          onChange={(values) =>
            updateQuery({ post: values.map((v) => parseInt(v)) })
          }
        />
        <Typography
          size="small"
          sx={{ mt: 0.5, opacity: 0.7, fontStyle: "italic" }}
        >
          Filter comments by Post ID.
        </Typography>
      </FormControl>
      <FormControl label="Status">
        <Select
          //sx={{ display: "block" }}
          size="medium"
          value={status?.toString() ?? ""}
          enum={STATUS_OPTIONS}
          onChange={(value) =>
            updateQuery({ status: value === "" ? undefined : value })
          }
        />
      </FormControl>
      <FormControl label="Order By">
        <Select
          size="medium"
          value={orderby?.toString() ?? "comment_date_gmt"}
          enum={ORDERBY_OPTIONS}
          onChange={(value) =>
            updateQuery({
              orderby: (value || undefined) as
                | "comment_date_gmt"
                | "comment_ID"
                | "comment_parent"
                | "comment_post_ID"
                | "comment_author"
                | "comment_type"
                | undefined,
              order: order ?? "desc",
            })
          }
        />
      </FormControl>
      <FormControl label="Order">
        <Select
          size="medium"
          value={order?.toString() ?? "desc"}
          enum={ORDER_OPTIONS}
          onChange={(value) =>
            updateQuery({
              order: (value || undefined) as "asc" | "desc" | undefined,
              orderby: orderby ?? "comment_date_gmt",
            })
          }
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
  );
};
