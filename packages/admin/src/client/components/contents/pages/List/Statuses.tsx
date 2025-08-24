import { Fragment, useEffect, useState } from "react";

import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";

import { Link } from "@rnaga/wp-next-ui/Link";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Typography } from "@rnaga/wp-next-ui/Typography";

export const Statuses = () => {
  const { actions } = useServerActions();
  const { pushRouter, searchParams, refreshValue } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"post">>();

  const [countStatuses, setCountStatuses] =
    useState<{ post_status?: string; count?: number }[]>();

  useEffect(() => {
    actions.post.countByStatuses("page").then((response) => {
      setCountStatuses(response.info?.countGroupBy ?? []);
    });
  }, [refreshValue().content]);

  if (!countStatuses) {
    return <Typography>Loading...</Typography>;
  }

  const totalCount = countStatuses.reduce(
    (total, item) => total + (item.count || 0),
    0
  );

  const createLink = (status: string, count: number) => {
    return searchParams.get("status") === status ? (
      <>
        {status} ({count})
      </>
    ) : (
      <Link onClick={() => pushRouter({ status: [status], page: 1 })}>
        {status} ({count})
      </Link>
    );
  };

  return (
    <Typography size="medium">
      {searchParams.size > 0 ? (
        <Link component="button" onClick={() => pushRouter({})}>
          All ({totalCount})
        </Link>
      ) : (
        <>All ({totalCount})</>
      )}{" "}
      {countStatuses.map((status, index) => (
        <Fragment key={index}>
          {" | "}
          {createLink(status.post_status ?? "Unknown", status.count ?? 0)}
        </Fragment>
      ))}
    </Typography>
  );
};
