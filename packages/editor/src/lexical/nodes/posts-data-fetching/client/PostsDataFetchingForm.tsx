import { useMemo } from "react";

import { Checkmarks, CheckmarksItem } from "@rnaga/wp-next-ui/Checkmarks";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SelectFreeSoloAutocomplete } from "@rnaga/wp-next-ui/SelectFreeSoloAutocomplete";
import {
  SelectWPCategories,
  SelectWPTags,
} from "@rnaga/wp-next-ui/SelectWPTerms";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import type * as wpTypes from "@rnaga/wp-node/types";

const ORDER_OPTIONS: { label: string; value: string }[] = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

const ORDERBY_OPTIONS: { label: string; value: string }[] = [
  { label: "Date", value: "post_date" },
  { label: "Post ID", value: "ID" },
  { label: "Title", value: "post_title" },
  { label: "Author", value: "post_author" },
  { label: "Modified Date", value: "post_modified" },
  { label: "Slug", value: "post_name" },
];

import { FormControl } from "../../../../client/forms/components";
import { useDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";
import {
  ALLOWED_QUERY_PASSTHROUGH_KEYS,
  PostsDataFetchingNode,
} from "../PostsDataFetchingNode";

export const PostsDataFetchingForm = () => {
  const { currentNode, query, updateQuery, updateAllowedQueryPassthroughKeys } =
    useDataFetchingForm<PostsDataFetchingNode>();

  const { tags, categories, postType, search, order, orderby } = useMemo(() => {
    const nodeQuery = currentNode?.getQuery();

    return {
      tags: nodeQuery?.tags ?? query?.tags,
      categories: nodeQuery?.categories ?? query?.categories,
      postType: nodeQuery?.postType ?? query?.postType ?? "post",
      search: query?.search ?? nodeQuery?.search,
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

  const handlePostTypeChange = (value: string) => {
    if (value !== "post") {
      const { categories, tags, ...rest } = currentNode?.getQuery() || {};
      updateQuery({ postType: value as wpTypes.PostType, ...rest });
      return;
    }

    updateQuery({ postType: value as wpTypes.PostType });
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
      {postType === "post" && (
        <>
          <FormControl label="Categories">
            <SelectWPCategories
              size="medium"
              value={categories?.toString() ?? ""}
              onChange={(categories) =>
                updateQuery({
                  categories: categories.map(Number),
                })
              }
            />
          </FormControl>
          <FormControl label="Tags">
            <SelectWPTags
              size="medium"
              value={tags?.toString() ?? ""}
              onChange={(tags) => updateQuery({ tags: tags.map(Number) })}
            />
          </FormControl>
        </>
      )}
      <FormControl label="Post Type">
        <SelectFreeSoloAutocomplete
          size="medium"
          value={postType}
          items={[
            { label: "post", value: "post" },
            { label: "page", value: "page" },
            { label: "attachment", value: "attachment" },
          ]}
          onChange={handlePostTypeChange}
        />
      </FormControl>
      <FormControl label="Per Page">
        <Input
          sx={{ display: "block" }}
          size="medium"
          type="number"
          value={query?.per_page?.toString() ?? ""}
          onChange={(value) =>
            updateQuery("per_page", value ? Number(value) : undefined)
          }
        />
      </FormControl>
      <FormControl label="Order By">
        <Select
          size="medium"
          value={orderby?.toString() ?? "post_date"}
          enum={ORDERBY_OPTIONS}
          onChange={(value) =>
            updateQuery({
              orderby: (value || undefined) as
                | "post_date"
                | "ID"
                | "post_title"
                | "post_author"
                | "post_modified"
                | "post_name"
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
              orderby: orderby ?? "post_date",
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
