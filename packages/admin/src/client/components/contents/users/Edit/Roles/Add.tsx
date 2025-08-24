import { useEffect, useState } from "react";

import CancelIcon from "@mui/icons-material/Cancel";

import { useAdminServerActions } from "../../../../../hooks/use-admin-server-actions";
import { useWPAdmin } from "../../../../../wp-admin";
import { Edit } from "./Edit";

import type * as types from "../../../../../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Select } from "@rnaga/wp-next-ui/Select";
import { Button } from "@rnaga/wp-next-ui/Button";

export const Add = (props: {
  blogs: wpCoreTypes.actions.RoleEditableBlogs;
}) => {
  const { blogs } = props;
  const { overlay } = useWPAdmin();
  const { actions, parse } = useAdminServerActions();

  const [show, setShow] = useState(false);
  const [selectedBlog, setSelectedBlog] =
    useState<wpCoreTypes.actions.RoleEditableBlogs[number]>();
  const [roleAdditiveBlogs, setRoleAdditiveBlogs] =
    useState<wpCoreTypes.actions.RoleAdditiveBlogs>();

  useEffect(() => {
    const blogIds = blogs.map((blog) => blog.blog_id);
    actions.adminUser.getRoleAdditiveBlogs(blogIds).then((response) => {
      const [blogs] = parse(response);
      setRoleAdditiveBlogs(blogs);
    });
  }, [show, blogs]);

  const handleAddNewButton = () => {
    setShow(true);
  };

  const handelSelected = (blogId: number) => {
    for (const blog of roleAdditiveBlogs ?? []) {
      if (blog?.blog_id === blogId) {
        setSelectedBlog(blog);
        break;
      }
    }
  };

  const handleCancelEdit = () => {
    setSelectedBlog(undefined);
    setShow(false);
  };

  if (!show) {
    if (roleAdditiveBlogs && roleAdditiveBlogs.length > 0) {
      return (
        <Button size="medium" onClick={handleAddNewButton}>
          Add New Role
        </Button>
      );
    }

    return null;
  }

  if (!roleAdditiveBlogs) {
    return "Loading..";
  }

  if (1 >= roleAdditiveBlogs.length) {
    return (
      <>
        {roleAdditiveBlogs[0]?.blogname}

        <Edit
          show
          blogId={roleAdditiveBlogs[0].blog_id}
          roles={roleAdditiveBlogs[0].blog_roles}
          onCancelEdit={handleCancelEdit}
        />
      </>
    );
  }

  if (selectedBlog) {
    return (
      <>
        {selectedBlog.blogname}

        <Edit
          show
          blogId={selectedBlog.blog_id}
          roles={selectedBlog.blog_roles}
          onCancelEdit={handleCancelEdit}
        />
      </>
    );
  }

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Select
        size="medium"
        label="Select Blog"
        enum={roleAdditiveBlogs.map((blog) => ({
          label: blog.blogname!,
          value: blog.blog_id,
        }))}
        onChange={(v) => handelSelected(parseInt(`${v}`))}
        sx={{
          minWidth: 300,
        }}
      />
      <Tooltip title="Cancel" placement="top">
        <IconButton color="error" size="small" onClick={handleCancelEdit}>
          <CancelIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};
