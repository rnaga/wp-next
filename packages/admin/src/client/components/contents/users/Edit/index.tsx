import { useEffect, useMemo, useState } from "react";
import { z } from "zod";

import { Box } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { Tabs } from "@rnaga/wp-next-ui/Tabs";

import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";
import { ApplicationPasswords } from "./ApplicationPasswords";
import { Profile } from "./Profile";
import { Roles } from "./Roles/";

export const Edit = (props?: { userId?: number; isProfile?: boolean }) => {
  const { user } = useUser();
  const { site } = useWPAdmin();
  const { searchParams, refreshValue } = useAdminNavigation();
  const { actions, safeParse } = useServerActions();

  const [canEditUser, setCanEditUser] = useState<boolean>();
  const refreshContent = refreshValue().content;

  const userId =
    props?.userId && user?.ID == props.userId
      ? props.userId
      : z
          .string()
          .transform((v) => parseInt(v))
          .parse(searchParams.get("id"));

  useEffect(() => {
    (async () => {
      const response = await actions.user
        .can("edit_user", userId as number)
        .then(safeParse);
      if (!response.success) {
        console.info(response.error);
        setCanEditUser(false);
        return;
      }
      setCanEditUser(response.data);
    })();
  }, []);

  const canUpdateRole = useMemo(
    () =>
      user?.role.capabilities.has("promote_user") ||
      user?.role.capabilities.has("remove_users"),
    [user?.role.capabilities]
  );

  const canManageApplicationPasswords = useMemo(
    () =>
      props?.isProfile === true &&
      (user?.role.capabilities.has("edit_users") ||
        (site.isMultiSite && user?.role.names.has("superadmin")) ||
        (!site.isMultiSite && user?.role.names.has("administrator"))),
    [user?.role.capabilities, props?.isProfile]
  );

  if (canEditUser === undefined) {
    return null;
  }

  const tabItems = [
    ...(canEditUser
      ? [{ label: "Profile", content: <Profile userId={userId} /> }]
      : []),
    ...(canManageApplicationPasswords
      ? [
          {
            label: "Application Passwords",
            content: <ApplicationPasswords key={`ap-${refreshContent}`} />,
          },
        ]
      : []),
    ...(canUpdateRole
      ? [
          {
            label: "Roles",
            content: <Roles key={`role-${refreshContent}`} userId={userId} />,
          },
        ]
      : []),
  ];

  return (
    <Box
      sx={{
        //backgroundColor: (theme) => theme.palette.background.surface,
        width: "100%",
      }}
    >
      <Tabs
        items={tabItems}
        size="medium"
        slotSxProps={{
          tab: {
            width: `calc(100% / ${tabItems.length})`,
            minWidth: "unset",
          },
        }}
      />
    </Box>
  );
};
