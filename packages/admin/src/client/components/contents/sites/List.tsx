import { useEffect, useState, useTransition } from "react";

import { AccordionDetails } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Accordion } from "@rnaga/wp-next-ui/Accordion";
import {
  ActionTd,
  ListGrid,
  ListGridItem,
  ListGridTitle,
  SortableTh,
  Table,
  Td,
  Th,
  THead,
  Tr,
} from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useAdminUser } from "../../../hooks/use-admin-user";
import { AdminLink } from "../../utils/link";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const List = () => {
  const { navigationStatus, queryObject } = useAdminNavigation();
  const { actions, parse } = useServerActions();
  const { adminUser } = useAdminUser();

  const [sites, setSites] = useState<wpCoreTypes.actions.Sites>();
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const [sites] = await actions.site
        .list({ per_page: 999, ...queryObject })
        .then(parse);
      setSites(sites);
    });
  }, [navigationStatus]);

  const canEditSite = (siteId: number) => {
    return adminUser.availableSites.sites?.some(
      (site) => site.site_id == siteId && site.is_superadmin
    );
  };

  if (!sites) {
    return null;
  }

  return (
    <Loading loading={loading}>
      <Table>
        <THead>
          <SortableTh name="Name" orderby="id" />
          <SortableTh name="Domain" orderby="domain" viewport="desktop" />
          <Th viewport="desktop">Path</Th>
        </THead>
        <tbody>
          {sites?.map((site) => (
            <Tr style={{ paddingTop: "1em" }} key={`${site.id}`}>
              <ActionTd>
                <Typography>{site.site_name}</Typography>
                {canEditSite(site.id) && (
                  <AdminLink subPage="edit" queryParams={{ id: site.id }}>
                    Edit
                  </AdminLink>
                )}
              </ActionTd>
              <Td viewport="mobile">
                <Accordion>
                  <ListGridTitle title={site.site_name} />
                  <AccordionDetails>
                    {canEditSite(site.id) && (
                      <AdminLink subPage="edit" queryParams={{ id: site.id }}>
                        Edit
                      </AdminLink>
                    )}
                    <ListGrid>
                      <ListGridItem title="Domain">{site.domain}</ListGridItem>
                      <ListGridItem title="Path">{site.path}</ListGridItem>
                    </ListGrid>
                  </AccordionDetails>
                </Accordion>
              </Td>
              <Td viewport="desktop">{site.domain}</Td>
              <Td viewport="desktop">{site.path}</Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Loading>
  );
};
