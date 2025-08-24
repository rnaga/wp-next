import React, { useEffect, useState } from "react";

import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { Link } from "@rnaga/wp-next-ui/Link";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
export const CountRoles = () => {
  const { site } = useWPAdmin();
  const { actions, parse } = useServerActions();

  const { pushRouter, searchParams, queryObject } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"user">>();

  const [roles, setRoles] = useState<Record<string, number | undefined>>();

  useEffect(() => {
    const params = queryObject?.site_id
      ? { site_id: queryObject.site_id }
      : queryObject?.blog_id
      ? { blog_id: queryObject.blog_id }
      : site.blogId
      ? { blog_id: site.blogId }
      : undefined;

    // Early return if params is not set
    if (!params) {
      return;
    }

    actions.roles.count(params).then((response) => {
      const [roles] = parse(response);
      setRoles(roles);
    });
  }, [site.blogId, queryObject?.blog_id, queryObject?.site_id]);

  if (!roles) {
    return null;
  }

  const buildQueryObject = (qb: typeof queryObject = {}) => {
    return {
      ...(queryObject?.site_id
        ? {
            site_id: queryObject.site_id,
          }
        : {
            blog_id: queryObject?.blog_id ?? site.blogId,
          }),
      ...qb,
    };
  };

  const elements = [
    Object.keys(queryObject ?? {}).filter(
      (key) => false === ["site_id", "blog_id", "page"].includes(key)
    ).length > 0 ? (
      <React.Fragment key="all">
        <Link component="button" onClick={() => pushRouter(buildQueryObject())}>
          All
        </Link>{" "}
      </React.Fragment>
    ) : (
      <React.Fragment key="all"> All</React.Fragment>
    ),
  ];

  elements.push(<React.Fragment key="separator">{" | "} </React.Fragment>);

  Object.entries(roles)
    .filter(([, count]) => count && count > 0)
    .forEach(([roleName, count], index, arr) => {
      let newQueryObject: typeof queryObject;
      if (roleName == "superadmins") {
        newQueryObject = buildQueryObject({ superadmins: true });
      } else {
        newQueryObject = buildQueryObject({
          roles: [`${roleName}`],
        });
      }
      elements.push(
        searchParams.get("roles") === roleName ||
          searchParams.get("superadmins") === "true" ? (
          <React.Fragment key={`role-${roleName}`}>
            {roleName} ({count})
          </React.Fragment>
        ) : (
          <React.Fragment key={`role-${roleName}`}>
            <Link onClick={() => pushRouter(newQueryObject)}>{roleName}</Link> (
            {count})
          </React.Fragment>
        )
      );

      if (index + 1 < arr.length) {
        elements.push(
          <React.Fragment key={`separator-${index}`}>{" | "}</React.Fragment>
        );
      }
    });

  return (
    <Typography size="medium" component="div">
      {elements}
    </Typography>
  );
};
