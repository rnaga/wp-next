import { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import { DataInputAllKeysEndDecorator } from "../../../forms/components/DataInputAllKeysEndDecorator";

import type * as types from "../../../../types";

type MetaRow = {
  id: string;
  key: string;
  value: string;
  readOnlyKey?: boolean;
};

const createRowId = () =>
  `meta-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizePageMeta = (
  pageMeta?: types.TemplatePageMeta
): types.TemplatePageMeta => {
  const normalized: types.TemplatePageMeta = {
    title: typeof pageMeta?.title === "string" ? pageMeta.title : "",
    description:
      typeof pageMeta?.description === "string" ? pageMeta.description : "",
  };

  if (!pageMeta) {
    return normalized;
  }

  for (const [key, value] of Object.entries(pageMeta)) {
    const trimmedKey = key.trim();
    if (!trimmedKey || trimmedKey === "title" || trimmedKey === "description") {
      continue;
    }

    normalized[trimmedKey] = value == null ? "" : String(value);
  }

  return normalized;
};

const pageMetaToRows = (pageMeta?: types.TemplatePageMeta): MetaRow[] => {
  const normalized = normalizePageMeta(pageMeta);
  const customRows = Object.entries(normalized)
    .filter(([key]) => key !== "title" && key !== "description")
    .map(([key, value]) => ({
      id: createRowId(),
      key,
      value: String(value ?? ""),
    }));

  return [
    {
      id: createRowId(),
      key: "title",
      value: normalized.title,
      readOnlyKey: true,
    },
    {
      id: createRowId(),
      key: "description",
      value: normalized.description,
      readOnlyKey: true,
    },
    ...customRows,
  ];
};

const rowsToPageMeta = (rows: MetaRow[]): types.TemplatePageMeta => {
  const pageMeta: types.TemplatePageMeta = {
    title: "",
    description: "",
  };

  for (const row of rows) {
    if (row.readOnlyKey && row.key === "title") {
      pageMeta.title = row.value || "";
      continue;
    }

    if (row.readOnlyKey && row.key === "description") {
      pageMeta.description = row.value || "";
      continue;
    }

    const key = row.key.trim();
    if (!key || key === "title" || key === "description") {
      continue;
    }

    pageMeta[key] = row.value || "";
  }

  return pageMeta;
};

const arePageMetaEqual = (
  left: types.TemplatePageMeta,
  right: types.TemplatePageMeta
) => JSON.stringify(left) === JSON.stringify(right);

export const PageMetaSettings = (props: {
  pageMeta: types.TemplatePageMeta | undefined;
  onChange: (pageMeta: types.TemplatePageMeta) => void;
}) => {
  const [editor] = useLexicalComposerContext();
  const { pageMeta, onChange } = props;
  const [rows, setRows] = useState<MetaRow[]>(() => pageMetaToRows(pageMeta));

  useEffect(() => {
    const normalizedIncoming = normalizePageMeta(pageMeta);

    setRows((prevRows) => {
      const currentMeta = rowsToPageMeta(prevRows);
      if (arePageMetaEqual(currentMeta, normalizedIncoming)) {
        return prevRows;
      }

      return pageMetaToRows(normalizedIncoming);
    });
  }, [pageMeta]);

  const updateRows = (updater: (current: MetaRow[]) => MetaRow[]) => {
    setRows((prevRows) => updater(prevRows));
  };

  useEffect(() => {
    const nextPageMeta = rowsToPageMeta(rows);
    const currentPageMeta = normalizePageMeta(pageMeta);

    if (arePageMetaEqual(nextPageMeta, currentPageMeta)) {
      return;
    }

    onChange(nextPageMeta);
  }, [rows, pageMeta, onChange]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography size="medium" bold>
        Page Meta
      </Typography>
      <Typography size="small" sx={{ color: "text.secondary" }}>
        Configure metadata for the template page head tags (title and meta
        tags).
      </Typography>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {rows.map((row) => (
          <Box
            key={row.id}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Input
              size="medium"
              value={row.key}
              readOnly={row.readOnlyKey}
              onChange={(value) => {
                if (row.readOnlyKey) {
                  return;
                }

                updateRows((currentRows) =>
                  currentRows.map((item) =>
                    item.id === row.id ? { ...item, key: value || "" } : item
                  )
                );
              }}
              placeholder="key"
              sx={{ minWidth: "180px", flex: 1 }}
            />
            <Input
              size="medium"
              value={row.value}
              onChange={(value) => {
                updateRows((currentRows) =>
                  currentRows.map((item) =>
                    item.id === row.id ? { ...item, value: value || "" } : item
                  )
                );
              }}
              endAdornment={
                <DataInputAllKeysEndDecorator
                  onClick={(dataValue) => {
                    const dataVariable = `\${${dataValue}}`;
                    updateRows((currentRows) =>
                      currentRows.map((item) =>
                        item.id === row.id
                          ? {
                              ...item,
                              value: `${item.value || ""}${dataVariable}`,
                            }
                          : item
                      )
                    );
                  }}
                />
              }
              placeholder="value"
              sx={{ flex: 2 }}
            />
            {!row.readOnlyKey && (
              <Tooltip title="Remove">
                <IconButton
                  size="small"
                  onClick={() => {
                    updateRows((currentRows) =>
                      currentRows.filter((item) => item.id !== row.id)
                    );
                  }}
                  sx={{ color: "error.main" }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        ))}
      </Box>

      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={() => {
          updateRows((currentRows) => [
            ...currentRows,
            { id: createRowId(), key: "", value: "" },
          ]);
        }}
        sx={{ alignSelf: "flex-start" }}
      >
        Add
      </Button>
    </Box>
  );
};
