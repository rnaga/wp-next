"use client";
import { useEffect, useState, useTransition } from "react";

import { AccordionDetails, Stack } from "@mui/material";
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

import { AdminLink } from "../../../../components/utils/link";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { CountRoles } from "./CountRoles";
import { Toolbar } from "./Toolbar";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const List = () => {
  const { actions, parse } = useServerActions();
  const { queryObject, navigationStatus } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"user">>();

  const [loading, startTransition] = useTransition();

  const [list, setList] = useState<{
    users: wpCoreTypes.actions.UsersEdit;
    info: wpCoreTypes.actions.UsersEditInfo;
  }>();

  useEffect(() => {
    startTransition(async () => {
      const [users, info] = await actions.user
        .list(
          { ...queryObject, per_page: 20 },
          {
            context: "edit",
          }
        )
        .then(parse);
      setList({ users, info });
    });
  }, [navigationStatus]);

  return (
    <Stack spacing={1}>
      <Toolbar list={list}>
        <CountRoles />
      </Toolbar>

      <Loading loading={loading}>
        <Table>
          <THead>
            <SortableTh name="Username" orderby="user_login" />
            <Th viewport="desktop">Name</Th>
            <SortableTh viewport="desktop" name="Email" orderby="user_email" />
            <Th viewport="desktop">Role</Th>
            <Th viewport="desktop">Posts</Th>
          </THead>
          <tbody>
            {list?.users?.map((user) => (
              <Tr style={{ paddingTop: "1em" }} key={`${user.ID}`}>
                <ActionTd>
                  <Typography size="medium" bold>
                    {user.user_login}
                  </Typography>
                  <AdminLink subPage="edit" queryParams={{ id: user.ID }}>
                    Edit
                  </AdminLink>
                </ActionTd>
                <Td viewport="mobile">
                  <Accordion>
                    <ListGridTitle title={user.user_login} />
                    <AccordionDetails>
                      <AdminLink subPage="edit" queryParams={{ id: user.ID }}>
                        Edit
                      </AdminLink>
                      <ListGrid>
                        <ListGridItem title="Name">
                          {user.display_name}
                        </ListGridItem>
                        <ListGridItem title="Email">
                          {user.user_email}
                        </ListGridItem>
                        <ListGridItem title="Role">
                          {user.roles.join(",")}
                        </ListGridItem>
                        <ListGridItem title="Posts">{user.posts}</ListGridItem>
                      </ListGrid>
                    </AccordionDetails>
                  </Accordion>
                </Td>
                <Td viewport="desktop">
                  <Typography>{user.display_name}</Typography>
                </Td>
                <Td viewport="desktop">
                  <Typography>{user.user_email}</Typography>
                </Td>
                <Td viewport="desktop">
                  <Typography>{user.roles.join(",")}</Typography>
                </Td>
                <Td viewport="desktop">
                  <Typography>{user.posts}</Typography>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Loading>
    </Stack>
  );
};
