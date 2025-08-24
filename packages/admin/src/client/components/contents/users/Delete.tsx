import { useEffect, useRef, useState } from "react";
import { z } from "zod";

import {
  Alert,
  Box,
  FormControl,
  List,
  ListItem,
  Radio,
  RadioGroup,
  Stack,
} from "@mui/material";
import { useServerActions } from "@rnaga/wp-next-core/client/hooks/use-server-actions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { SelectWPUser } from "@rnaga/wp-next-ui/SelectWPUser";
import { useWPTheme } from "@rnaga/wp-next-ui/ThemeRegistry";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { useAdminNavigation } from "../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../wp-admin";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Delete = () => {
  const { searchParams, gotoPath } = useAdminNavigation();
  const {
    wp: { error },
    overlay,
  } = useWPAdmin();
  const { actions, parse } = useServerActions();
  const { wpTheme } = useWPTheme();

  const [author, setAuthor] = useState<wpCoreTypes.actions.User>();
  const [blogs, setBlogs] = useState<wpCoreTypes.actions.UserBlogs>();
  const [disabledRecord, setDisabledRecord] = useState<Record<number, boolean>>(
    {}
  );

  const userIdMap = useRef<Map<number, number>>(new Map());
  const reassignMap = useRef<Map<number, number>>(new Map());

  const [selectRadioValue, setSelectRadioValue] = useState<
    Record<number, "delete" | "inherit">
  >({});

  const userId = z
    .string()
    .transform((v) => parseInt(v))
    .parse(searchParams.get("id"));

  useEffect(() => {
    actions.user.get(userId).then((response) => {
      const [user] = parse(response);
      setAuthor(user);
    });
  }, []);

  useEffect(() => {
    const fetchBlogs = async () => {
      const [result] = await actions.user
        .can("delete_user", userId)
        .then(parse);

      if (!result) {
        error.throw("Not permitted");
      }

      const [blogs] = await actions.user.getBlogs(userId).then(parse);
      return blogs;
    };

    fetchBlogs().then((blogs) => {
      setBlogs(blogs);
    });
  }, [userId]);

  const handleReassign = (reassign: boolean, blogId: number) => (e: any) => {
    if (!reassign) {
      reassignMap.current.delete(blogId);
      setDisabledRecord({ ...disabledRecord, [blogId]: true });
    } else {
      const userId = userIdMap.current.get(blogId);
      if (userId) {
        reassignMap.current.set(blogId, userId);
      }
      setDisabledRecord({ ...disabledRecord, [blogId]: false });
    }

    setSelectRadioValue({ ...selectRadioValue, [blogId]: e.target.value });
  };

  const hanldeUserIdChange =
    (blogId: number) => (user: wpCoreTypes.actions.Users[number]) => {
      reassignMap.current.set(blogId, user.ID);
      userIdMap.current.set(blogId, user.ID);
    };

  const handleSubmit = () => {
    overlay.confirm.open(
      "This action cannot be undone. This will permanently delete the user.",
      async (confirm) => {
        if (!confirm) {
          return;
        }

        const [result] = await overlay.circular.promise(
          actions.user
            .del(userId, {
              reassignList: Object.fromEntries(reassignMap.current),
            })
            .then(parse)
        );

        if (result) {
          gotoPath("/users");
        }
      }
    );
  };

  const isDisabled = (blogId: number) => {
    return typeof disabledRecord?.[blogId] !== "boolean"
      ? true
      : disabledRecord?.[blogId];
  };

  if (!blogs || !author) {
    return null;
  }

  return (
    <Stack sx={{ pb: 10 }}>
      <Alert variant="outlined" severity="error" sx={{ mb: 2 }}>
        <Typography size="medium" color="error" bold>
          You have chosen to delete the user from all networks and sites.
        </Typography>
      </Alert>
      {0 == blogs.length ? (
        <Typography size="medium">
          <b>{author.display_name}</b> has no sites or content and will be
          deleted.
        </Typography>
      ) : (
        <>
          <Typography size="medium">
            What should be done with content owned by{" "}
            <b>{author.display_name}</b>?
          </Typography>
          <Box
            sx={{
              // Set opacity to 0.5 on border
              border: "1px solid",
              borderColor: wpTheme.colorScale[400],
              borderRadius: 1,
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {blogs.map((blog) => (
              <FormControl key={`${blog.blog_id}`}>
                <Typography size="medium">Blog: {blog.blogname}</Typography>
                <RadioGroup defaultValue="delete" name={blog.blogname}>
                  <List>
                    <ListItem>
                      <Typography size="medium" component="div">
                        <Radio
                          value="delete"
                          checked={
                            !selectRadioValue[blog.blog_id] ||
                            selectRadioValue[blog.blog_id] === "delete"
                          }
                          onChange={handleReassign(false, blog.blog_id)}
                        />
                        Delete all content.
                      </Typography>
                    </ListItem>
                    <ListItem>
                      <Typography size="medium" component="div">
                        <Radio
                          value="inherit"
                          checked={selectRadioValue[blog.blog_id] === "inherit"}
                          onChange={handleReassign(true, blog.blog_id)}
                        />
                        Inherit all content to another user.
                      </Typography>
                    </ListItem>
                    {selectRadioValue[blog.blog_id] === "inherit" && (
                      <ListItem
                        sx={{
                          pl: 7,
                          display: "grid",
                          gridTemplate: `
                          auto 
                          1fr`,
                          alignItems: "center",
                          gap: 1,
                          py: 0,
                        }}
                      >
                        <Typography size="medium">
                          Attribute all content to:
                        </Typography>
                        <SelectWPUser
                          size="medium"
                          blogId={blog.blog_id}
                          defaultValue={1}
                          onChange={hanldeUserIdChange(blog.blog_id)}
                          slotSxProps={{
                            input: {
                              minWidth: 250,
                            },
                          }}
                        />
                      </ListItem>
                    )}
                  </List>
                </RadioGroup>
              </FormControl>
            ))}
          </Box>
        </>
      )}
      <Box sx={{ mt: 2 }}>
        <Button size="medium" sx={{ mt: 2 }} onClick={handleSubmit}>
          Confirm Deletion
        </Button>
      </Box>
    </Stack>
  );
};
