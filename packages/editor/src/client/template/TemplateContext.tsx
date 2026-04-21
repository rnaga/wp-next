"use client";

import { logger } from "../../lexical/logger";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useNavigation } from "@rnaga/wp-next-core/client/hooks";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import { resetEditor } from "../../lexical";
import { validateLexicalJson } from "../../lexical/validate-lexical-json";
import { storeQueryCache } from "../../lexical/nodes/cache/CacheNode";
import { useEditorServerActions } from "../hooks/use-editor-server-actions";
import { useRefresh } from "../refresh";
import {
  TEMPLATE_DELETED_COMMAND,
  TEMPLATE_ID_UPDATED,
  TEMPLATE_PREVIEW_EDITOR_STATE_UPDATED_COMMAND,
  TEMPLATE_RESET_COMMAND,
  TEMPLATE_SETTINGS_UPDATED_COMMAND,
} from "./commands";
import { SettingsModal } from "./components/SettingsModal";
import { CreateModal } from "./components/CreateModal";
import { SelectModal } from "./components/SelectModal";
import { ViewPageModal } from "./components/ViewPageModal";
import { CreateCollectionModal } from "./components/navigator/CreateCollectionModal";

import type * as types from "../../types";
import type * as wpCoreTypes from "@rnaga/wp-next-core/types";
import { JsonViewModal } from "./components/JsonViewModal";
import { content } from "@rnaga/wp-node/defaults/seeder";
import { addWPHooksActionCommands, trackEventEnd } from "../event-utils";

// TODO: Too many states in this context, split into smaller contexts?
const Context = createContext<{
  current: {
    id: number | undefined;
    template?: types.Template;
    isEmpty: boolean;
    widgetSlugs: undefined | string[];
    set: (args: {
      template: types.Template;
      widgetSlugs: undefined | string[];
    }) => void;
  };
  previewInfoList: types.TemplatePreviewInfoList;
  setPreviewInfoList: (infoList: types.TemplatePreviewInfoList) => void;
  selectedPreview: types.SelectedTemplatePreview | undefined;
  setSelectedPreview: (preview: types.SelectedTemplatePreview) => void;
  previewEditorStateStringRef: React.RefObject<string>;

  templates: types.PostWithCollection[] | undefined;
  setTemplates: (templates: types.PostWithCollection[]) => void;

  resetTemplate: (callback?: VoidFunction) => void;
  panelOpen: boolean;
  setPanelOpen: (open: boolean) => void;

  // Settings modal
  settingsModal: {
    open: boolean;
  };
  openSettingsModal: () => void;
  closeSettingsModal: () => void;

  // Create modal (for creating templates)
  createModal: {
    open: boolean;
  };
  openCreateModal: () => void;
  closeCreateModal: () => void;

  // Create collection modal
  createCollectionModal: {
    open: boolean;
  };
  openCreateCollectionModal: () => void;
  closeCreateCollectionModal: () => void;

  // Select modal (for selecting templates)
  selectModal: {
    open: boolean;
  };
  openSelectModal: () => void;
  closeSelectModal: () => void;

  // JSON view modal
  jsonViewModal: {
    open: boolean;
    brokenJson?: string;
    loadError?: string;
  };
  openJsonViewModal: (brokenJson?: string, loadError?: string) => void;
  closeJsonViewModal: () => void;

  // View page modal (for building URLs with required path/query mapping values)
  viewPageModal: {
    open: boolean;
  };
  openViewPageModal: () => void;
  closeViewPageModal: () => void;

  saveEditorState: (options?: {
    description?: string;
    published?: boolean;
  }) => Promise<{
    success: boolean;
    error?: string;
    previewInfoKey?: string;
  }>;
  publishPreview: (options?: { description?: string }) => Promise<boolean>;
  isCurrentStateSyncedWithSavedState: () => boolean;

  switchTemplate: (id: number | undefined, callback?: VoidFunction) => void;
}>({} as any);

export const useTemplateContext = () => useContext(Context);

export const TemplateContext = (props: { children: React.ReactNode }) => {
  const { children } = props;

  // Settings modal state
  const [openSettingsModalState, setOpenSettingsModalState] = useState(false);

  const settingsModal = useMemo(
    () => ({
      open: openSettingsModalState,
    }),
    [openSettingsModalState]
  );

  // Create modal state
  const [openCreateModalState, setOpenCreateModalState] = useState(false);

  // Create collection modal state
  const [openCreateCollectionModalState, setOpenCreateCollectionModalState] =
    useState(false);

  const createCollectionModal = useMemo(
    () => ({
      open: openCreateCollectionModalState,
    }),
    [openCreateCollectionModalState]
  );

  // The last manually saved editor state string (excludes auto-saves).
  // Compared against the current editor state in `isCurrentStateSyncedWithSavedState`
  // to detect unsaved changes and prompt before switching previews.
  const savedStateStringRef = useRef<string | undefined>(undefined);

  const createModal = useMemo(
    () => ({
      open: openCreateModalState,
    }),
    [openCreateModalState]
  );

  // Select modal state
  const [openSelectModalState, setOpenSelectModalState] = useState(false);

  const selectModal = useMemo(
    () => ({
      open: openSelectModalState,
    }),
    [openSelectModalState]
  );

  // JSON view modal state
  const [jsonViewModalState, setJsonViewModalState] = useState<{
    open: boolean;
    brokenJson?: string;
    loadError?: string;
  }>({ open: false });

  const jsonViewModal = useMemo(() => jsonViewModalState, [jsonViewModalState]);

  const [editor] = useLexicalComposerContext();
  const { queryObject, pushRouter } = useNavigation<{ id: number }>();
  const [currentTemplate, setCurrentTemplate] = useState<{
    template: types.Template | undefined;
    widgetSlugs: undefined | string[];
  }>();
  const [isEmpty, setIsEmpty] = useState(false);
  const { wpHooks } = useWP();

  const [templates, setTemplates] = useState<
    types.PostWithCollection[] | undefined
  >(undefined);

  const [templateId, setTemplateId] = useState<number>();

  const [panelOpen, setPanelOpen] = useState(false);
  const [resetMode, setResetMode] = useState(false);

  const previewEditorStateStringRef = useRef<string>("");
  const [previewInfoList, setPreviewInfoList] =
    useState<types.TemplatePreviewInfoList>([]);
  const [selectedPreview, setSelectedPreviewState] =
    useState<types.SelectedTemplatePreview>();

  const { refresh, refreshKeys } = useRefresh();
  const { actions, parse } = useEditorServerActions();

  const updateCurrentTemplate = (args: {
    template: Partial<types.Template> | undefined;
    widgetSlugs?: undefined | string[];
  }) => {
    if (!args.template) {
      resetTemplate();
      return;
    }

    // Cache template id and widgetVariants to Nodes
    storeQueryCache(editor, {
      templateId: args.template?.ID,
      widgetVariants: args.template?.template_config?.widgetVariants ?? {},
    });

    const newTemplate = {
      ...currentTemplate?.template,
      ...args.template,
    } as types.Template;

    const widgetSlugs = args.widgetSlugs ?? currentTemplate?.widgetSlugs;

    setCurrentTemplate({
      template: newTemplate,
      widgetSlugs,
    });

    setIsEmpty(false);
  };

  const setSelectedPreview = (preview: types.SelectedTemplatePreview) => {
    previewEditorStateStringRef.current = preview.editorStateString;
    setSelectedPreviewState(preview);
  };

  const resetTemplate = (callback?: VoidFunction) => {
    setCurrentTemplate(undefined);
    setIsEmpty(true);
    resetEditor(editor);

    callback &&
      setTimeout(() => {
        callback();
      }, 0);

    wpHooks.action.doCommand(TEMPLATE_RESET_COMMAND, undefined);
  };

  const saveEditorState = async (options?: {
    description?: string;
    published?: boolean;
  }) => {
    const editorStateString = JSON.stringify(editor.getEditorState());

    // Validate before saving — throws if JSON is syntactically or structurally invalid.
    try {
      validateLexicalJson(editorStateString);
    } catch (e) {
      return {
        success: false,
        error: `Invalid editor state: ${e instanceof Error ? e.message : String(e)}`,
        previewInfoKey: undefined,
      };
    }
    // Fall back to the URL-derived templateId when currentTemplate hasn't been
    // populated yet (e.g. load failed due to a data-fetching error and the user
    // edits the JSON directly to fix the template before retrying).
    const currentTemplateId = currentTemplate?.template?.ID ?? templateId;
    if (!currentTemplateId) {
      return {
        success: false,
        error: "No template to save",
        previewInfoKey: undefined,
      };
    }

    const result = await actions.preview.savePreview(
      currentTemplateId,
      editorStateString,
      {
        description: options?.description,
        published: options?.published,
      }
    );

    if (result.success) {
      const { editorStateKey, infoKey, previewInfo } = result.data;

      // Call autoSavePreview
      // This ensures that after saving, the preview layer will reflect the latest editor state.
      await actions.preview.autoSavePreview(
        currentTemplateId,
        editorStateString
      );

      wpHooks.action.doCommand(TEMPLATE_PREVIEW_EDITOR_STATE_UPDATED_COMMAND, {
        templateId: currentTemplateId,
        editorStateKey,
        infoKey,
        previewInfo,
        editorStateString,
      });

      // TODO: Call setSelectedPreview and update selectedPreview
      setSelectedPreview({
        editorStateString,
        editorStateKey,
        previewInfo,
      });

      // Sync savedStateString so the editor reflects the newly saved state as "clean"
      savedStateStringRef.current = editorStateString;
    }

    return {
      success: result.success,
      error: result.success ? undefined : result.error,
      previewInfoKey: result.success ? result.data.infoKey : undefined,
    };
  };

  // publishPreview takes 2 steps:
  // 1. Save the current editor state as a new preview (same as savePreview)
  // 2. call publishPreview API to publish the saved preview
  const publishPreview = async (options?: { description?: string }) => {
    const templateId = currentTemplate?.template?.ID;

    if (!templateId) {
      return false;
    }

    // 1. Save the current editor state as a new preview (marked as published)
    const saveResult = await saveEditorState({
      ...options,
      published: true,
    });
    if (!saveResult || !saveResult.success) {
      logger.error("Failed to save preview before publishing", saveResult);
      return false;
    }

    // 2. Get the meta key of the saved preview from selectedPreview (which is set in saveEditorState)
    const previewInfoKey = saveResult.previewInfoKey;

    if (!previewInfoKey) {
      return false;
    }

    const result = await actions.preview.publishPreview(
      templateId,
      previewInfoKey
    );

    return result.success;
  };

  const openSettingsModal = () => {
    setOpenSettingsModalState(true);
  };

  const closeSettingsModal = () => {
    setOpenSettingsModalState(false);
  };

  const openCreateModal = () => {
    setOpenCreateModalState(true);
  };

  const closeCreateModal = () => {
    setOpenCreateModalState(false);
  };

  const openCreateCollectionModal = () => {
    setOpenCreateCollectionModalState(true);
  };

  const closeCreateCollectionModal = () => {
    setOpenCreateCollectionModalState(false);
  };

  const openSelectModal = () => {
    setOpenSelectModalState(true);
  };

  const closeSelectModal = () => {
    setOpenSelectModalState(false);
  };

  const openJsonViewModal = (brokenJson?: string, loadError?: string) => {
    setJsonViewModalState({ open: true, brokenJson, loadError });
  };

  const closeJsonViewModal = () => {
    setJsonViewModalState({ open: false });
  };

  // View page modal state
  const [openViewPageModalState, setOpenViewPageModalState] = useState(false);

  const viewPageModal = useMemo(
    () => ({ open: openViewPageModalState }),
    [openViewPageModalState]
  );

  const openViewPageModal = () => {
    setOpenViewPageModalState(true);
  };

  const closeViewPageModal = () => {
    setOpenViewPageModalState(false);
  };

  const switchTemplate = (id: number | undefined, callback?: VoidFunction) => {
    if (!id) {
      return;
    }

    pushRouter({ id });

    callback?.();
  };

  useEffect(() => {
    if (!templateId) {
      return;
    }

    const fetchPreviewInfoList = async (templateId: number) => {
      const result = await actions.preview.getPreviewInfoList(templateId);

      if (!result.success) {
        logger.error("Failed to get preview info list");
        return;
      }

      setPreviewInfoList(result.data);
    };
    fetchPreviewInfoList(templateId);

    return addWPHooksActionCommands<{ templateId: number }>(
      wpHooks,
      [TEMPLATE_PREVIEW_EDITOR_STATE_UPDATED_COMMAND, TEMPLATE_ID_UPDATED],
      (_, { templateId }) => {
        fetchPreviewInfoList(templateId);
      }
    );
  }, [templateId]);

  const fetchTemplateList = async () => {
    const result = await actions.template.listWithCollection();
    if (result.success && result.data) {
      setTemplates(result.data as types.PostWithCollection[]);
    }
  };

  const isCurrentStateSyncedWithSavedState = () => {
    const editorStateString = JSON.stringify(editor.getEditorState());
    return editorStateString === savedStateStringRef.current;
  };

  useEffect(() => {
    fetchTemplateList();
  }, [refreshKeys.template]);

  useEffect(() => {
    return addWPHooksActionCommands(wpHooks, [TEMPLATE_DELETED_COMMAND], () => {
      fetchTemplateList();
    });
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(TEMPLATE_RESET_COMMAND, async () => {
      const result = await actions.template.listWithCollection();
      const templateList = result.success ? result.data : null;

      setResetMode(true);

      if (!templateList || templateList.length === 0) {
        setOpenCreateModalState(true);
      } else {
        setOpenSelectModalState(true);
      }
    });
  }, []);

  useEffect(() => {
    return wpHooks.action.addCommand(
      TEMPLATE_SETTINGS_UPDATED_COMMAND,
      ({ templateId, template }) => {
        fetchTemplateList();
        updateCurrentTemplate({
          template: {
            ID: templateId,
            ...template,
          },
        });
      }
    );
  }, []);

  useEffect(() => {
    const templateId = parseInt(`${queryObject.id}`);

    if (isNaN(templateId) || 0 >= templateId) {
      resetTemplate();
      return;
    }

    // Clear stale template data immediately so saveEditorState falls back to
    // the URL-derived templateId and never uses a stale currentTemplate.template.ID
    // from the previous template during the transition.
    setCurrentTemplate(undefined);
    setTemplateId(templateId);
    setIsEmpty(false);

    // Update cache and notify PreviewLayer to load the new template.
    // Centralising this here (instead of in switchTemplate) ensures loadTemplate
    // fires for all navigation paths — both app-level switchTemplate and direct
    // URL changes (e.g. typing in the browser address bar).
    storeQueryCache(editor, { templateId });
    wpHooks.action.doCommand(TEMPLATE_ID_UPDATED, { templateId });
  }, [queryObject.id]);

  // AutoSave logic - save editor state to preview every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentTemplate?.template?.ID) {
        logger.log("Auto-saving editor state...");
        actions.preview
          .autoSavePreview(
            currentTemplate.template.ID,
            JSON.stringify(editor.getEditorState())
          )
          .then((result) => {
            if (result.success) {
              logger.log("Auto-save successful");
            } else {
              logger.error("Auto-save failed");
            }
            logger.log("Auto-save result:", result);
          });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentTemplate]);

  // When a preview is selected, fetch the last manually saved editor state
  // and store it in savedStateString to establish the "clean" baseline for
  // unsaved-changes detection.
  useEffect(() => {
    if (!selectedPreview || !templateId) {
      return;
    }

    const fetchSavedState = async () => {
      const result = await actions.preview.getLatestPreviewEditorState(
        templateId,
        { enableAutoSave: false }
      );

      if (!result.success) {
        // No manually-saved preview exists yet (e.g. new template with no save history).
        // Use the currently loaded preview state as the clean baseline instead.
        logger.warn(
          "Failed to fetch latest preview editor state, falling back to selected preview state",
          result.error
        );
        savedStateStringRef.current = selectedPreview.editorStateString;
        return;
      }

      savedStateStringRef.current = result.data.editorStateString;
    };

    trackEventEnd(
      "template_preview_selected",
      () => {
        fetchSavedState();
      },
      1000
    );
  }, [selectedPreview]);

  return (
    <Context
      value={{
        panelOpen,
        setPanelOpen,
        current: {
          id: templateId,
          template: currentTemplate?.template,
          widgetSlugs: currentTemplate?.widgetSlugs,
          set: updateCurrentTemplate,
          isEmpty,
        },
        previewInfoList,
        setPreviewInfoList,
        setSelectedPreview,
        selectedPreview,
        isCurrentStateSyncedWithSavedState,
        previewEditorStateStringRef,
        templates,
        setTemplates,
        resetTemplate,
        settingsModal,
        openSettingsModal,
        closeSettingsModal,
        createModal,
        openCreateModal,
        closeCreateModal,
        createCollectionModal,
        openCreateCollectionModal,
        closeCreateCollectionModal,
        selectModal,
        openSelectModal,
        closeSelectModal,
        jsonViewModal,
        openJsonViewModal,
        closeJsonViewModal,
        viewPageModal,
        openViewPageModal,
        closeViewPageModal,
        saveEditorState,
        publishPreview,
        switchTemplate,
      }}
    >
      <SettingsModal
        open={settingsModal.open}
        onClose={() => {
          closeSettingsModal();
        }}
      />
      <CreateModal
        open={createModal.open}
        onClose={() => {
          closeCreateModal();
          setResetMode(false);
        }}
        hideCloseButton={resetMode}
      />
      <SelectModal
        open={selectModal.open}
        onClose={() => {
          closeSelectModal();
          setResetMode(false);
        }}
        hideCloseButton={resetMode}
      />
      <JsonViewModal
        open={jsonViewModal.open}
        brokenJson={jsonViewModal.brokenJson}
        loadError={jsonViewModal.loadError}
        onClose={() => {
          closeJsonViewModal();
        }}
      />
      <ViewPageModal
        open={viewPageModal.open}
        onClose={() => {
          closeViewPageModal();
        }}
      />
      <CreateCollectionModal
        open={createCollectionModal.open}
        onClose={() => {
          closeCreateCollectionModal();
        }}
      />
      {children}
    </Context>
  );
};
