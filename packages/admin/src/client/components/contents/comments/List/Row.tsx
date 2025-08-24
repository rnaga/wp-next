"use client";
import { Box } from "@mui/material";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { CardImage } from "@rnaga/wp-next-ui/CardImage";
import { Chip } from "@rnaga/wp-next-ui/Chip";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { Viewport } from "@rnaga/wp-next-ui/Viewport";

import { ActionTd, Table, Td, Tr } from "@rnaga/wp-next-ui/list";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { useWPAdmin } from "../../../../wp-admin";
import { ActionLink } from "../ActionLink";
import { Reply } from "./Reply";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Row = (props: {
  comment: wpCoreTypes.actions.Comments[number];
}) => {
  const { comment } = props;
  const {
    wp: { viewport },
  } = useWPAdmin();
  const { userCan } = useUser();
  const { updateRouter } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"comment">>();

  return (
    <Table sx={{ backgroundColor: "inherit" }}>
      <tbody>
        <Tr style={{ backgroundColor: "inherit" }}>
          <Td style={{ width: "20%" }}>
            <Box>
              <Typography bold>
                {comment.user_display_name ?? comment.comment_author}
              </Typography>
            </Box>
            <Viewport device="mobile">
              <Typography
                sx={{ display: "block", mt: 1, mb: 2 }}
                component="div"
              >
                {comment.comment_content}
                {userCan("edit_comment", comment) && (
                  <ActionLink comment={comment} />
                )}
              </Typography>
            </Viewport>
          </Td>
          <ActionTd style={{ width: "40%" }}>
            <Typography sx={{ display: "block" }}>
              {comment.comment_content}
            </Typography>
            {userCan("edit_comment", comment) && (
              <ActionLink comment={comment} />
            )}
          </ActionTd>

          <Td viewport="desktop" style={{ width: "20%" }}>
            {comment.post_type == "attachment" && (
              <CardImage
                src={comment.post_guid}
                alt={comment.post_title}
                sx={{ width: 80, height: 80 }}
              />
              // <AspectRatio sx={{ width: 80 }} ratio={4 / 3}>
              //   <MediaThumbnail uri={comment.post_guid} />
              // </AspectRatio>
            )}
            <Typography bold>{comment.post_title}</Typography>
            {comment.post_comment_count > 0 && (
              <Box>
                <Chip
                  onClick={() =>
                    updateRouter({
                      post: [comment.comment_post_ID],
                      page: 1,
                    })
                  }
                  label={`${comment.post_comment_count} Comments`}
                />
              </Box>
            )}
          </Td>

          <Td viewport="desktop">{comment.comment_date}</Td>
        </Tr>
        {comment.children && (
          <Tr
            style={{
              borderBottom: "0px solid transparent",
              backgroundColor: "inherit",
            }}
          >
            <Td colSpan={viewport.isMobile ? 1 : 4}>
              <Box sx={{ height: 0, position: "absolute" }}>
                <Chip
                  sx={{ position: "relative", top: -25 }}
                  label={`${comment.children.length} Replies`}
                />
              </Box>
              <Reply comment={comment} />
            </Td>
          </Tr>
        )}
      </tbody>
    </Table>
  );
};
