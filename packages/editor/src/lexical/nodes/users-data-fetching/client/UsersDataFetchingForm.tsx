import { useMemo } from "react";

import { Checkmarks, CheckmarksItem } from "@rnaga/wp-next-ui/Checkmarks";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { FormControl } from "../../../../client/forms/components";
import { useDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";
import {
  ALLOWED_QUERY_PASSTHROUGH_KEYS,
  UsersDataFetchingNode,
} from "../UsersDataFetchingNode";

const ORDER_OPTIONS: { label: string; value: string }[] = [
  { label: "Ascending", value: "asc" },
  { label: "Descending", value: "desc" },
];

const ORDERBY_OPTIONS: { label: string; value: string }[] = [
  { label: "Display Name", value: "display_name" },
  { label: "User ID", value: "ID" },
  { label: "Username", value: "user_login" },
  { label: "Registration Date", value: "user_registered" },
  { label: "Email", value: "user_email" },
  { label: "URL", value: "user_url" },
];

export const UsersDataFetchingForm = () => {
  const { currentNode, query, updateQuery, updateAllowedQueryPassthroughKeys } =
    useDataFetchingForm<UsersDataFetchingNode>();

  const { search, roles, order, orderby } = useMemo(() => {
    const nodeQuery = currentNode?.getQuery();

    return {
      search: nodeQuery?.search ?? query?.search,
      roles: nodeQuery?.roles ?? query?.roles,
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
        <Typography
          size="small"
          sx={{ mt: 0.5, opacity: 0.7, fontStyle: "italic" }}
        >
          Search users by name or email.
        </Typography>
      </FormControl>
      <FormControl label="Roles">
        <InputMultiple
          size="medium"
          value={Array.isArray(roles) ? roles : []}
          onChange={(values) =>
            updateQuery({ roles: values.length > 0 ? values : undefined })
          }
        />
        <Typography
          size="small"
          sx={{ mt: 0.5, opacity: 0.7, fontStyle: "italic" }}
        >
          Filter users by roles (e.g., administrator, editor).
        </Typography>
      </FormControl>
      <FormControl label="Order By">
        <Select
          size="medium"
          value={orderby?.toString() ?? "display_name"}
          enum={ORDERBY_OPTIONS}
          onChange={(value) =>
            updateQuery({
              orderby: (value || undefined) as
                | "ID"
                | "display_name"
                | "user_login"
                | "user_registered"
                | "user_email"
                | "user_url"
                | undefined,
              order: order ?? "asc",
            })
          }
        />
      </FormControl>
      <FormControl label="Order">
        <Select
          size="medium"
          value={order?.toString() ?? "asc"}
          enum={ORDER_OPTIONS}
          onChange={(value) =>
            updateQuery({
              order: (value || undefined) as "asc" | "desc" | undefined,
              orderby: orderby ?? "display_name",
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
