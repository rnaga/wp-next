import { useMemo } from "react";

import { Checkmarks, CheckmarksItem } from "@rnaga/wp-next-ui/Checkmarks";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { Select } from "@rnaga/wp-next-ui/Select";
import { SelectFreeSoloAutocomplete } from "@rnaga/wp-next-ui/SelectFreeSoloAutocomplete";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import type * as wpTypes from "@rnaga/wp-node/types";

import { FormControl } from "../../../../client/forms/components";
import { useDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";
import {
  ALLOWED_QUERY_PASSTHROUGH_KEYS,
  TermsDataFetchingNode,
} from "../TermsDataFetchingNode";

type Taxonomy = NonNullable<wpTypes.crud.CrudParameters<"term", "list">[0]>;

const ORDER_OPTIONS: { label: string; value: string }[] = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

const ORDERBY_OPTIONS: { label: string; value: string }[] = [
  { label: "Term ID", value: "term_id" },
  { label: "Name", value: "name" },
  { label: "Slug", value: "slug" },
  { label: "Term Group", value: "term_group" },
  { label: "Term Order", value: "term_order" },
  { label: "Description", value: "description" },
];

export const TermsDataFetchingForm = () => {
  const { currentNode, query, updateQuery, updateAllowedQueryPassthroughKeys } =
    useDataFetchingForm<TermsDataFetchingNode>();

  const {
    taxonomy,
    post,
    slug,
    search,
    hide_empty: hideEmpty,
    parent,
    order,
    orderby,
  } = useMemo(() => {
    const nodeQuery = currentNode?.getQuery();

    return {
      taxonomy: nodeQuery?.taxonomy ?? query?.taxonomy,
      post: query?.post || nodeQuery?.post,
      slug: query?.slug || nodeQuery?.slug,
      search: nodeQuery?.search ?? query?.search,
      order: nodeQuery?.order ?? query?.order,
      hide_empty: nodeQuery?.hide_empty ?? query?.hide_empty,
      parent: nodeQuery?.parent ?? query?.parent,
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
      <FormControl label="Taxonomy">
        <SelectFreeSoloAutocomplete
          size="medium"
          value={taxonomy || "category"}
          items={[
            { label: "category", value: "category" },
            { label: "post_tag", value: "post_tag" },
          ]}
          onChange={(value) => updateQuery("taxonomy", value)}
        />
      </FormControl>
      <FormControl label="Term Slug">
        <InputMultiple
          size="medium"
          value={(slug || []).map((v) => `${v}`)}
          onChange={(values) => updateQuery("slug", values)}
        />
        <Typography
          size="small"
          sx={{ mt: 0.5, opacity: 0.7, fontStyle: "italic" }}
        >
          Filter by term slug.
        </Typography>
      </FormControl>
      <FormControl label="Post">
        <Input
          sx={{ display: "block" }}
          size="medium"
          type="number"
          value={post?.toString() ?? ""}
          onChange={(value) =>
            updateQuery("post", value ? Number(value) : undefined)
          }
        />
        <Typography
          size="small"
          sx={{ mt: 0.5, opacity: 0.7, fontStyle: "italic" }}
        >
          Filter terms associated with a specific post ID.
        </Typography>
      </FormControl>
      <FormControl label="Parent">
        <Input
          sx={{ display: "block" }}
          size="medium"
          type="number"
          value={parent?.toString() ?? ""}
          onChange={(value) =>
            updateQuery("parent", value ? Number(value) : undefined)
          }
        />
      </FormControl>
      <FormControl label="Hide Empty">
        <Select
          size="medium"
          value={hideEmpty ? "true" : "false"}
          enum={[
            { label: "No", value: "false" },
            { label: "Yes", value: "true" },
          ]}
          onChange={(value) => updateQuery("hide_empty", value === "true")}
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
          value={orderby?.toString() ?? "term_id"}
          enum={ORDERBY_OPTIONS}
          onChange={(value) =>
            updateQuery({
              taxonomy: (taxonomy ?? "category") as Taxonomy,
              orderby: (value || undefined) as
                | "term_id"
                | "name"
                | "slug"
                | "term_group"
                | "term_order"
                | "description"
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
              taxonomy: (taxonomy ?? "category") as Taxonomy,
              order: (value || undefined) as "asc" | "desc" | undefined,
              orderby: orderby ?? "term_id",
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
