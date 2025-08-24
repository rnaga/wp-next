import type * as wpTypes from "@rnaga/wp-node/types";
import { useContext, useState } from "react";

import CancelIcon from "@mui/icons-material/Cancel";
import DoneIcon from "@mui/icons-material/Done";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { SelectMultiple } from "@rnaga/wp-next-ui/SelectMultiple";

import { useAdminNavigation } from "../../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../../wp-admin";
import { RoleEditContext } from "./context";

export const Edit = (props: {
  blogId: number | undefined;
  roles: Record<string, wpTypes.Role>;
  show: boolean;
  onCancelEdit: (...args: any) => any;
}) => {
  const { blogId, show, onCancelEdit } = props;
  let { roles } = props;

  const { overlay } = useWPAdmin();
  const { refresh } = useAdminNavigation();
  const { actions, safeParse } = useServerActions();

  const [values, setValues] = useState<string[]>();

  const { userId, targetBlogs } = useContext(RoleEditContext);

  if (!show) {
    return null;
  }

  // superadmin and anonymous can't be edited through this component.
  const roleNames =
    Object.keys(roles).filter(
      (roleName) => !["superadmin", "anonymous"].includes(roleName)
    ) ?? [];

  const defaultRoleNames = targetBlogs
    ?.filter((blog) => blog.blog_id == blogId)[0]
    ?.rolenames?.filter(
      (roleName) => !["superadmin", "anonymous"].includes(roleName)
    );

  const selectedRoleNames = Array.from(
    new Set(values ?? defaultRoleNames ?? [])
  );

  const handleUpdateRole = async () => {
    if (!values || !userId || !blogId) {
      return;
    }

    const result = await overlay.circular.promise(
      actions.user
        .updateRole(userId, values, {
          blogId,
        })
        .then(safeParse)
    );

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    refresh(["content"]);
  };

  return (
    <Box sx={{ display: "flex", gap: 0.5, alignItems: "center" }}>
      <SelectMultiple
        items={roleNames.map((roleName) => ({
          label: roleName,
          id: roleName,
        }))}
        value={selectedRoleNames}
        onChange={(items) => {
          const newRoleNames = items.map((item) => item.id);
          setValues(newRoleNames);
          console.log("onChange", items);
        }}
        slotSxProps={{
          input: { minWidth: "300px", minHeight: "28px" },
        }}
        limitTags={5}
      />

      <Tooltip title="Update Roles" placement="top">
        <IconButton color="success" size="small" onClick={handleUpdateRole}>
          <DoneIcon />
        </IconButton>
      </Tooltip>
      <Tooltip title="Cancel" placement="top">
        <IconButton color="error" size="small" onClick={onCancelEdit}>
          <CancelIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
