import { useState } from "react";

import { Box, Stack } from "@mui/material";
import { SimpleTreeView, TreeItem } from "@mui/x-tree-view";
import { useUser } from "@rnaga/wp-next-core/client/hooks/use-user";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { comments as toCommentHierarchy } from "@rnaga/wp-node/common/hierarchy";

import { AdminLink } from "../../../../components/utils/link";
import { useAdminNavigation } from "../../../../hooks/use-admin-navigation";
import { ActionLink } from "../ActionLink";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";

export const Reply = (props: {
  comment: NonNullable<wpCoreTypes.actions.Comments[number]>;
}) => {
  const { comment: parentComment } = props;
  const replies = parentComment.children;

  const { updateRouter } =
    useAdminNavigation<wpCoreTypes.actions.SearchQuery<"comment">>();
  const { userCan } = useUser();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  if (!replies) {
    return null;
  }

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent,
    itemIds: string[]
  ) => {
    setExpandedItems(itemIds);
  };

  const handleExpandClick = () => {
    setExpandedItems((oldExpanded) =>
      oldExpanded.length === 0
        ? replies.flatMap((comment) => `${comment.comment_ID}`)
        : []
    );
  };

  const hierarchy = toCommentHierarchy(replies);

  const items = (comments: typeof hierarchy) =>
    comments.map((comment) => (
      <TreeItem
        key={`${comment.comment_ID}`}
        itemId={`${comment.comment_ID}`}
        label={
          <Typography>
            Replied by{" "}
            <Typography fontWeight={600} component="span">
              {comment.comment_author ?? comment.display_name}{" "}
            </Typography>
            on{" "}
            <Typography fontWeight={600} component="span">
              {comment.comment_date?.split(" ")[0]}
            </Typography>
          </Typography>
        }
      >
        <Stack spacing={1}>
          {userCan("edit_comment", parentComment) && (
            <ActionLink comment={comment} />
          )}
          <Box>
            <Typography sx={{ mx: 1 }}>{comment.comment_content}</Typography>
          </Box>
          {comment.children &&
            comment.children.length > 0 &&
            items(comment.children)}
        </Stack>
      </TreeItem>
    ));

  return (
    <>
      {parentComment.children && parentComment.children?.length > 1 && (
        <Box sx={{ mb: 1, display: "flex", gap: 1 }}>
          <AdminLink onClick={handleExpandClick}>
            {expandedItems.length === 0 ? "Expand All" : "Collapse All"}
          </AdminLink>
          {parentComment.count_children > 10 && (
            <AdminLink
              onClick={() =>
                updateRouter({ parent: [parentComment.comment_ID] })
              }
            >
              View All Replies
            </AdminLink>
          )}
        </Box>
      )}
      <SimpleTreeView
        sx={{ overflowY: "auto" }}
        expandedItems={expandedItems}
        onExpandedItemsChange={handleExpandedItemsChange}
      >
        {items(hierarchy)}
      </SimpleTreeView>
    </>
  );
};
