"use client";

import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import type { SelectedRevision } from ".";

import { useEffect, useState } from "react";

import { Typography } from "@rnaga/wp-next-ui/Typography";
import { List, ListItem, ListItemButton, Stack, Step } from "@mui/material";

export const History = (props: {
  revisions?: wpCoreTypes.actions.Revisions;
  onClick: (revision: SelectedRevision) => void;
}) => {
  const { revisions, onClick } = props;
  const mapByDate = new Map<string, SelectedRevision[]>();

  const [selectedId, setSelectedId] = useState<number>();

  useEffect(() => {
    setSelectedId(revisions?.[0]?.ID);
  }, []);

  const handleClick = (revision: SelectedRevision) => {
    console.log("revision.target?.ID", revision.target?.ID, selectedId);
    setSelectedId(revision.target?.ID);
    onClick(revision);
  };

  const formatDate = (revision: SelectedRevision) =>
    revision?.target?.post_modified?.split(" ")[1];

  if (!revisions) {
    return null;
  }

  for (let i = 0; i < revisions.length; i++) {
    const revision = revisions[i];

    const date = (revision.post_modified as string).split(" ")[0];
    if (!date) return;
    const revisionList = mapByDate.get(date) ?? [];
    mapByDate.set(date, [...revisionList, { index: i, target: revision }]);
  }

  const list: React.ReactNode[] = [];
  for (const [date, revisions] of mapByDate.entries()) {
    list.push(
      <Step key={date}>
        <Typography size="medium" bold>
          {date}
        </Typography>
        <Stack sx={{ mr: 2 }}>
          <List
            sx={{
              p: 0,
            }}
          >
            {revisions.map((revision) => (
              <ListItem key={`${revision.index}`} sx={{ p: 0 }}>
                <ListItemButton
                  selected={selectedId == revision.target?.ID}
                  color="primary"
                  onClick={() => handleClick(revision)}
                >
                  <Typography>{formatDate(revision)}</Typography>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Stack>
      </Step>
    );
  }

  return list;
};
