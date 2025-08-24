import { useState } from "react";

import SettingIcon from "@mui/icons-material/Settings";
import { Box, IconButton, Tooltip } from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { Button } from "@rnaga/wp-next-ui/Button";
import { useFormDataContext } from "@rnaga/wp-next-ui/hooks/use-form-data";
import { IconButtonDelete } from "@rnaga/wp-next-ui/IconButtonDelete";
import { Input } from "@rnaga/wp-next-ui/Input";
import { formatting } from "@rnaga/wp-node/common/formatting";

import { usePanelContext } from "../../../../components/utils/post";
import { useAdminNavigation } from "../../../../hooks";
import { useWPAdmin } from "../../../../wp-admin";

import type * as types from "../../../../../types";

export const Toolbar = () => {
  const { overlay } = useWPAdmin();
  const { user } = useUser();
  const { formData, setFormData } =
    useFormDataContext<types.client.formdata.PostUpsert>("post");
  const { router, gotoPath, refresh } = useAdminNavigation();
  const { actions, safeParse, parse } = useServerActions();
  const { toggle, ref: panelRef } = usePanelContext();

  const [iconVarient, setIconVarient] = useState<"plain" | "solid">("solid");

  const postId = formData.ID;

  const handleSave = async () => {
    if (!formData.post_author) {
      formData.post_author = user?.ID;
    }

    // Covert Date object to string
    formData.post_date = formatting.dateMySQL(formData.post_date, {
      withGMTOffset: true,
    });

    formData.post_date_gmt = formatting.dateMySQL(formData.post_date);

    const serverAction = postId
      ? actions.post.update(postId, formData)
      : actions.post.create({ ...formData, post_type: "page" });

    const result = await overlay.circular.promise(serverAction).then(safeParse);

    if (!result.success) {
      overlay.snackbar.open("error", result.error);
      return;
    }

    overlay.snackbar.open("success", "Page has been saved");

    // After saving, the post may have changed (e.g., post_status could be "future" if the date is in the future).
    // Fetch the latest post data to ensure formData reflects any updates from the server.
    if (formData.ID) {
      // Get the updated post data
      const [updatedPost] = await actions.post.get(result.data).then(parse);
      setFormData(updatedPost);
      refresh(["content"]);
      return;
    }

    // If it's a new post, redirect to the edit page with the new post ID
    gotoPath("/pages/edit", {
      segment: "blog",
      queryParams: {
        id: result.data,
      },
    });
  };

  const handleTrash = async () => {
    if (!postId) {
      overlay.snackbar.open("error", "Invalid post");
      return;
    }

    await overlay.circular.promise(actions.post.trash(postId)).then(parse);

    router.back();
  };

  const handleToggle = () => {
    toggle();
    setIconVarient(iconVarient === "plain" ? "solid" : "plain");
  };

  return (
    <Box sx={{ display: "flex", gap: 2 }}>
      <Input
        size="large"
        key={formData?.ID ?? 0}
        value={formData?.post_title}
        onChange={(value) => setFormData({ post_title: value })}
        placeholder="Title"
        sx={{ fontWeight: 500, flexGrow: 1 }}
      />
      <Button onClick={handleSave}>Save</Button>
      {formData.ID && <IconButtonDelete onClick={handleTrash} />}
      <Tooltip title="Settings" placement="top">
        <IconButton onClick={handleToggle}>
          <SettingIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
