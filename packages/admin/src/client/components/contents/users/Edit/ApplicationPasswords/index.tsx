import { useEffect, useMemo, useState, useTransition } from "react";

import { Box } from "@mui/material";
import { useServerActions, useUser } from "@rnaga/wp-next-core/client/hooks";
import { Button } from "@rnaga/wp-next-ui/Button";
import { ActionTd, Table, Td, Th, THead, Tr } from "@rnaga/wp-next-ui/list";
import { Loading } from "@rnaga/wp-next-ui/Loading";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useWPAdmin } from "../../../../../wp-admin";
import { ActionLink } from "./ActionLink";
import { Create } from "./Create";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const ApplicationPasswords = () => {
  const { user } = useUser();
  const {
    overlay,
    wp: { error },
  } = useWPAdmin();
  const { actions, safeParse } = useServerActions();
  const [passwords, setPasswords] = useState<
    wpCoreTypes.actions.ApplicationPassword[]
  >([]);
  const [openCreate, setOpenCreate] = useState(false);

  const [loading, startTransition] = useTransition();

  const userId = useMemo(() => user?.ID, [user?.ID]);

  const fetchPasswords = async () => {
    if (!userId) {
      return;
    }

    startTransition(async () => {
      const response = await actions.applicationPasswords
        .list()
        .then(safeParse);

      if (!response.success || !response.data) {
        error.throw(response.error ?? "Failed to get user data");
      }

      setPasswords(response.data);
    });
  };

  useEffect(() => {
    if (!userId) {
      return;
    }

    fetchPasswords();
  }, [userId]);

  if (!userId) {
    return null;
  }

  return (
    <>
      <Create
        open={openCreate}
        onClose={() => {
          setOpenCreate(false);
        }}
        onCreate={() => {
          fetchPasswords();
        }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Button onClick={() => setOpenCreate(true)}>Create New Password</Button>
      </Box>
      <Loading loading={loading}>
        <Table
          sx={{
            mt: 2,
          }}
        >
          <THead>
            <Th viewport="desktop">Name</Th>
            <Th viewport="desktop">Created</Th>
            <Th viewport="desktop">Last Used</Th>
            <Th viewport="desktop">Last IP</Th>
          </THead>
          <tbody>
            {passwords.map((password) => (
              <Tr key={password.uuid}>
                <ActionTd
                  viewport="desktop"
                  style={{
                    minWidth: 200,
                  }}
                >
                  <Typography size="medium" bold>
                    {password.name}
                  </Typography>
                  <ActionLink password={password} />
                </ActionTd>
                <Td>{new Date(password.created * 1000).toLocaleString()}</Td>
                <Td>
                  {password.last_used
                    ? new Date(password.last_used * 1000).toLocaleString()
                    : "Never"}
                </Td>
                <Td>{password.last_ip || "Unknown"}</Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Loading>
    </>
  );
};
