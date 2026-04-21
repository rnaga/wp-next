import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import CodeEditor from "@monaco-editor/react";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SortIcon from "@mui/icons-material/Sort";
import {
  Box,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  Tooltip,
} from "@mui/material";

import {
  generateCustomCode,
  generateCustomCodeByEditor,
} from "../../lexical/custom-code";
import { List, ListItem } from "../forms/components/List";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useRefresh } from "../refresh";
import { useTemplate } from "../template";
import { LanguageChip } from "./LanguageChip";
import { useCustomCode } from "./use-custom-code";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { CUSTOM_CODE_FETCHED_AND_UPDATED } from "./commands";

import { SelectAutocomplete } from "@rnaga/wp-next-ui/SelectAutocomplete";

import type * as types from "../../types";
import { updateCustomCodeSlugs } from "../../lexical/nodes/custom-code/CustomCodeNode";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

export const TemplateSettingModal = () => {
  const {
    templateSetting,
    customCodes,
    openModal,
    actions: customCodeActions,
    current: customCodeCurrent,
  } = useCustomCode();

  const [editor] = useLexicalComposerContext();

  const { refresh } = useRefresh();

  const { current } = useTemplate();
  const { wpHooks } = useWP();

  // Tab state: "header" | "footer"
  const [activeTab, setActiveTab] =
    useState<types.CustomCodeInjectLocation>("header");

  // Separate list items per location
  const [headerListItems, setHeaderListItems] = useState<types.CustomCodeList>(
    []
  );
  const [footerListItems, setFooterListItems] = useState<types.CustomCodeList>(
    []
  );

  const listItems = activeTab === "header" ? headerListItems : footerListItems;
  const setListItems = (
    items:
      | types.CustomCodeList
      | ((prev: types.CustomCodeList) => types.CustomCodeList)
  ) => {
    if (activeTab === "header") {
      setHeaderListItems(items);
    } else {
      setFooterListItems(items);
    }
  };

  const refItemList = useRef<HTMLUListElement>(null);

  // isLoaded prevents the list-change effect from triggering save() during
  // initial/external syncs. It is set to false by syncListItemsFromContext and
  // restored to true by the mark-loaded effect that runs after the list-change effect.
  const isLoaded = useRef(false);
  const [dragged, setDragged] = useState<types.CustomCode>();
  const [dragEnabledId, setDragEnabledId] = useState<number | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  // Incremented on every sync so the mark-loaded effect always fires, even when
  // list data didn't change (React bail-out would skip effects otherwise).
  const [syncVersion, setSyncVersion] = useState(0);

  const previewContent = templateSetting.content?.[activeTab] ?? "";

  const handleDragStart = (customCode: types.CustomCode) =>
    setDragged(customCode);
  const handleDragEnd = () => setDragged(undefined);

  const handleDragEnter = (id: number) => {
    const target = customCodes?.find((customCode) => customCode.ID === id);
    if (!target || !dragged || dragged.ID === id) return;

    const newListItems = listItems.map((item) =>
      item.ID === target.ID ? dragged : item.ID === dragged.ID ? target : item
    );
    setListItems(newListItems);
  };

  const handleEdit = (customCode: types.CustomCode) => () =>
    openModal({ customCode });

  const handleDelete = (customCode: types.CustomCode) => () => {
    const newListItems = listItems.filter((item) => item.ID !== customCode.ID);
    setListItems(newListItems);
  };

  const handleClose = () => {
    templateSetting.closeModal();
  };

  const save = async (
    header: types.CustomCodeList,
    footer: types.CustomCodeList
  ) => {
    if (!current.id) return;

    setSaveLoading(true);

    updateCustomCodeSlugs(
      editor,
      "header",
      header.map((c) => c.post_name)
    );

    updateCustomCodeSlugs(
      editor,
      "footer",
      footer.map((c) => c.post_name)
    );

    templateSetting.setContent(await generateCustomCodeByEditor(editor));
    await customCodeActions.fetchAndSetCurrentCustomCode();

    setSaveLoading(false);
    refresh();
  };

  const handleEditorMount = (editor: any, monaco: any) => {
    editor.getAction("editor.action.formatDocument").run();
  };

  const handleSelectChange = (value: string) => {
    const ID = parseInt(value as string);
    const customCode = customCodes?.find((customCode) => customCode.ID === ID);
    if (!customCode) return;
    // Avoid duplicates within the same tab
    if (!listItems.some((item) => item.ID === customCode.ID)) {
      setListItems([...listItems, customCode]);
    }
  };

  // Items not yet added to either tab
  const availableItems = useMemo(
    () =>
      (customCodes ?? []).filter((c) => !listItems.some((s) => s.ID === c.ID)),
    [customCodes, listItems]
  );

  // Syncs list items directly from context data (no server calls).
  // Sets isLoaded=false so the list-change effect below does not trigger
  // save() while items are being updated from an external source.
  // Increments syncVersion to guarantee the mark-loaded effect always fires,
  // even when list data didn't change (React bail-out skips effects otherwise).
  const syncListItemsFromContext = useCallback(
    (all: Record<types.CustomCodeInjectLocation, types.CustomCodeList>) => {
      isLoaded.current = false;
      setHeaderListItems(all.header ?? []);
      setFooterListItems(all.footer ?? []);
      setSyncVersion((v) => v + 1);
    },
    []
  );

  // On modal open: populate list items from context (or trigger a fetch if not yet
  // available). Also subscribes to CUSTOM_CODE_FETCHED_AND_UPDATED so that edits
  // or deletions made in EditorModal are reflected here without extra server calls —
  // CustomCodeContext already keeps current.all up to date via fetchAndSetCurrentCustomCode.
  useEffect(() => {
    if (templateSetting.modalOpen) {
      if (customCodeCurrent.all) {
        syncListItemsFromContext(customCodeCurrent.all);
      } else {
        setLoading(true);
        customCodeActions.fetchAndSetCurrentCustomCode();
      }
    }

    return wpHooks.action.addCommand(
      CUSTOM_CODE_FETCHED_AND_UPDATED,
      ({
        customCodes: all,
      }: {
        customCodes: Record<
          types.CustomCodeInjectLocation,
          types.CustomCodeList
        >;
      }) => {
        if (templateSetting.modalOpen) {
          setLoading(false);
          syncListItemsFromContext(all);
        }
      }
    );
  }, [templateSetting.modalOpen, syncListItemsFromContext]);

  // Updates preview content and auto-saves whenever the list changes.
  // save() is guarded by isLoaded so it does not fire during initial/external
  // syncs — only after a user interaction (add, remove, reorder).
  useEffect(() => {
    templateSetting.setContent({
      header: generateCustomCode(headerListItems),
      footer: generateCustomCode(footerListItems),
    });

    if (isLoaded.current) {
      save(headerListItems, footerListItems);
    }
  }, [headerListItems, footerListItems]);

  // Restores isLoaded=true after the list-change effect above has run.
  // IMPORTANT: must stay declared after the list-change effect so React runs
  // it second within the same commit.
  // syncVersion is included so this always fires after a sync, even when list
  // data didn't change and React bails out on the list-change effect's deps.
  useEffect(() => {
    isLoaded.current = true;
  }, [headerListItems, footerListItems, syncVersion]);

  return (
    <Modal open={templateSetting.modalOpen} onClose={handleClose}>
      <ModalContent
        loading={loading}
        sx={{
          minWidth: "80%",
          maxWidth: "95%",
        }}
      >
        <Typography size="large" bold sx={{ mb: 1 }}>
          Custom Code Settings
        </Typography>
        <Tabs
          value={activeTab}
          onChange={(_e, val: types.CustomCodeInjectLocation) =>
            setActiveTab(val)
          }
          sx={{ mb: 1 }}
        >
          <Tab
            label="Header"
            value="header"
            sx={{
              textTransform: "none",
              //fontSize: 12,
              fontWeight: 600,
              minWidth: 40,
            }}
          />
          <Tab
            label="Footer"
            value="footer"
            sx={{
              textTransform: "none",
              //fontSize: 12,
              fontWeight: 600,
              minWidth: 40,
            }}
          />
        </Tabs>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "minmax(250px, 0.3fr) 0.7fr",
            gap: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1,
              height: "70dvh",
            }}
          >
            <SelectAutocomplete
              key={`${activeTab}-${listItems.map((c) => c.ID).join(",")}`}
              size="medium"
              items={availableItems.reduce(
                (acc, customCode) => {
                  acc.push({
                    label: `${customCode.post_title} (${
                      customCode.metas.mime_type.split("/")[1]
                    })`,
                    value: customCode.ID,
                  });
                  return acc;
                },
                [] as { label: string; value: number }[]
              )}
              onChange={handleSelectChange}
            />
            <Box sx={{ flexGrow: 1, minHeight: 0 }}>
              <LinearProgress
                sx={{ visibility: saveLoading ? "visible" : "hidden" }}
              />
              <List
                ref={refItemList}
                sx={{
                  height: "100%",
                  overflow: "auto",
                  border: (theme) => `1px solid ${theme.palette.grey[300]}`,
                  userSelect: "none",
                }}
              >
                {listItems.map((customCode) => (
                  <ListItem
                    key={customCode.ID}
                    draggable={
                      listItems.length > 1 && dragEnabledId === customCode.ID
                    }
                    sx={{ cursor: "default" }}
                    data-id={customCode.ID}
                    onDragStart={() => handleDragStart(customCode)}
                    onDragEnd={() => {
                      handleDragEnd();
                      setDragEnabledId(null);
                    }}
                    onDragEnter={(e) =>
                      handleDragEnter(Number(e.currentTarget.dataset.id))
                    }
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "flex",
                        cursor: listItems.length > 1 ? "grab" : "default",
                      }}
                      onMouseDown={() =>
                        listItems.length > 1 && setDragEnabledId(customCode.ID)
                      }
                      onMouseUp={() => setDragEnabledId(null)}
                    >
                      <SortIcon />
                    </Box>
                    <Box
                      sx={{
                        flexGrow: 1,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        size="medium"
                        sx={{
                          mx: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: 0,
                        }}
                      >
                        {customCode.post_title}
                      </Typography>
                      <LanguageChip mineType={customCode.metas.mime_type} />
                    </Box>

                    <Tooltip title="Edit code" placement="top">
                      <IconButton size="small" onClick={handleEdit(customCode)}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Remove" placement="top">
                      <IconButton
                        size="small"
                        onClick={handleDelete(customCode)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
          <Box>
            <CodeEditor
              options={{
                padding: { bottom: 0 },
                autoIndent: "advanced",
                formatOnPaste: true,
                formatOnType: true,
                readOnly: true,
              }}
              height="70dvh"
              defaultLanguage="html"
              value={previewContent}
              onMount={handleEditorMount}
            />
          </Box>
        </Box>
      </ModalContent>
    </Modal>
  );
};
