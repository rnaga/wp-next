import { useEffect, useState } from "react";

import { Box, FormControl, FormLabel, Stack } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Checkbox } from "@rnaga/wp-next-ui/Checkbox";
import { useFormData } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import * as wpDefaults from "@rnaga/wp-node/defaults";

import { useSites } from "../../../../hooks/";
import { useWPAdmin } from "../../../../wp-admin";
import { EditState } from "./";

export const EditModal = (props: {
  open: boolean;
  onClose: (...args: any) => any;
  editState: EditState;
  blogId: number | undefined;
}) => {
  const { open, onClose, editState, blogId } = props;
  const { role = undefined, roleName = undefined } = editState ?? {};
  const isUpdate = !!role;
  const defaultRoleNames = Object.keys(wpDefaults.roles);

  const {
    wp: { viewport },
    overlay,
  } = useWPAdmin();
  const { actions, execute, safeParse, loading } = useServerActions();
  const { formData, submit } = useFormData<{ name: string; role: string }>(
    "roles"
  );
  const { updateSites } = useSites();

  const [state, setState] = useState<{
    newCapability: string | undefined;
    errorNewCapability: boolean;
    checkboxes: { label: string; checked: boolean }[];
    selectedCapabilities: string[];
  }>({
    newCapability: undefined,
    errorNewCapability: false,
    checkboxes: [],
    selectedCapabilities: [],
  });

  const isDefaultRole = !!role?.name && defaultRoleNames.includes(role.name);

  const getDefaultCapabilitySet = () => {
    const capabilitySet = new Set<string>();
    Object.values(wpDefaults.roles)
      .filter((role) => role.name.toLowerCase() !== "superadmin")
      .map((role) =>
        role.capabilities.map((capability) => capabilitySet.add(capability))
      );

    return capabilitySet;
  };

  useEffect(() => {
    const capabilitySet = getDefaultCapabilitySet();

    role?.capabilities &&
      role.capabilities.map((capability) => capabilitySet.add(capability));

    setState({
      ...state,
      checkboxes: Array.from(capabilitySet).map((capability) => ({
        label: capability,
        checked: !!(
          role?.capabilities && role?.capabilities.includes(capability)
        ),
      })),
      selectedCapabilities: role?.capabilities ?? [],
    });
  }, [role]);

  const handleAddNewCapabilityValueChange = (value: string) => {
    if (value.length > 0 && !value.match(/^[a-z0-9_]+$/)) {
      setState({
        ...state,
        errorNewCapability: true,
      });
      return;
    }
    setState({
      ...state,
      errorNewCapability: false,
      newCapability: value,
    });
  };

  const handleAddNewCapability = () => {
    if (!state.newCapability) {
      return;
    }

    const capabilitySet = getDefaultCapabilitySet();
    const selectedCapabilitySet = new Set<string>();
    state.selectedCapabilities.forEach((capability) => {
      selectedCapabilitySet.add(capability);
      capabilitySet.add(capability);
    });
    selectedCapabilitySet.add(state.newCapability);
    capabilitySet.add(state.newCapability);

    setState({
      ...state,
      checkboxes: Array.from(capabilitySet).map((capability) => ({
        label: capability,
        checked: selectedCapabilitySet.has(capability),
      })),
      selectedCapabilities: Array.from(selectedCapabilitySet),
      newCapability: undefined,
    });
  };

  const handleCheckbox = (value: string, checked: boolean) => {
    const selectedCapabilitySet = new Set<string>();
    state.selectedCapabilities.forEach((capability) => {
      selectedCapabilitySet.add(capability);
    });

    selectedCapabilitySet[checked ? "add" : "delete"](value);
    setState({
      ...state,
      selectedCapabilities: Array.from(selectedCapabilitySet),
    });
  };

  const handleSubmit = async (data: typeof formData) => {
    let { name, role } = data;

    let args: Parameters<typeof actions.roles.update>[1] = {
      capabilities: state.selectedCapabilities,
    };

    if (name.length > 0) {
      args = { ...args, name };
    }

    if (isUpdate && editState?.roleName && role !== editState?.roleName) {
      // Change role name
      args = { ...args, new_role: role };
      role = editState.roleName;
    }

    const serverAction = isUpdate
      ? actions.roles.update(role, args, {
          blogId,
        })
      : actions.roles.create(
          { ...args, role },
          {
            blogId,
          }
        );

    const result = await execute(serverAction).then(safeParse);
    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    onClose();
    updateSites();
  };

  if (!blogId) {
    return null;
  }

  return (
    <Modal open={!!open} onClose={onClose} sx={{ zIndex: 2 }}>
      <ModalContent
        sx={
          {
            // overflowX: "auto",
            //maxHeight: viewport.isMobile ? "100%" : "100%",
          }
        }
      >
        <form onSubmit={submit(handleSubmit)}>
          <Typography
            size="xlarge"
            bold
            sx={{
              mb: 2,
            }}
          >
            Role
          </Typography>
          <Stack spacing={2}>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                size="large"
                name="name"
                required
                disabled={isDefaultRole}
                value={role?.name}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Role</FormLabel>
              <Input
                size="large"
                name="role"
                value={roleName}
                required
                disabled={isDefaultRole}
              />
            </FormControl>

            <Box sx={{ mt: 1 }}>
              <Typography>Capabilities</Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: 1,
                  overflowY: "auto",
                  my: 1,
                  maxHeight: "50dvh",
                }}
              >
                {state.checkboxes?.map((v) => (
                  <Checkbox
                    key={v.label}
                    label={v.label}
                    defaultChecked={v.checked}
                    onChange={(e) => {
                      handleCheckbox(v.label, e.target.checked);
                    }}
                  />
                ))}
              </Box>
            </Box>
            <Box
              sx={{
                mt: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
              }}
            >
              <Box>
                <Input
                  size="medium"
                  key={state.selectedCapabilities.length}
                  placeholder="Add New Capability"
                  error={state.errorNewCapability}
                  value={state.newCapability}
                  onChange={(value) => handleAddNewCapabilityValueChange(value)}
                  onKeyDown={(e) => {
                    e.code === "Enter" && handleAddNewCapability();
                  }}
                  endAdornment={
                    <Button
                      color="info"
                      onClick={() => handleAddNewCapability()}
                      sx={{
                        height: 28,
                      }}
                    >
                      Add{" "}
                    </Button>
                  }
                />
                {state.errorNewCapability && (
                  <Typography color="error">
                    Please use only lowercase letters, numbers, and underscores.
                  </Typography>
                )}
              </Box>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  size="medium"
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  sx={{
                    px: 4,
                  }}
                >
                  Submit
                </Button>
              </Box>
            </Box>
          </Stack>
        </form>
      </ModalContent>
    </Modal>
  );
};
