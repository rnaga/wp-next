import { useEffect, useState } from "react";
import { logger } from "../../../lexical/logger";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { Box, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { InputMultiple } from "@rnaga/wp-next-ui/InputMultiple";
import { Modal, ModalContent } from "@rnaga/wp-next-ui/Modal";
import { Select } from "@rnaga/wp-next-ui/Select";

import { getConfigurableNodeItems } from "../../../lexical/template-config";
import { Typography } from "@rnaga/wp-next-ui/Typography";
import { useEditorServerActions } from "../../hooks/use-editor-server-actions";
import { useRefresh } from "../../refresh";

import { PathMappingSettings } from "./settings-modal/PathMappingSettings";
import { PageMetaSettings } from "./settings-modal/PageMetaSettings";
import { QueryMappingSettings } from "./settings-modal/QueryMappingSettings";
import { Checkbox } from "@rnaga/wp-next-ui/Checkbox";
import { useTemplate } from "../use-template";

import * as vals from "../../../validators";

import type * as types from "../../../types";
import { useWP } from "@rnaga/wp-next-core/client/wp";
import { TEMPLATE_SETTINGS_UPDATED_COMMAND } from "../commands";
import { ButtonGroup } from "../../forms/components/ButtonGroup";
import { ModalConfirm } from "@rnaga/wp-next-ui/ModalConfirm";
import {
  isErrorSlug,
  isHomepageSlug,
  isValidPageSlug,
} from "../../../lexical/validate-slug";

const VariantNameInput = (props: {
  name: string;
  onRename: (newName: string) => void;
}) => {
  const { name, onRename } = props;
  const [error, setError] = useState<string | null>(null);

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.5 }}>
      <Input
        size="medium"
        value={name}
        placeholder="Variant Name"
        validate="^[a-z0-9_-]*$"
        onError={(msg) =>
          setError(
            msg
              ? 'Only lowercase letters, numbers, "-" and "_" are allowed'
              : null
          )
        }
        onChange={(newValue) => {
          if (newValue && newValue !== name) {
            onRename(newValue);
          }
        }}
      />
      {error && (
        <Typography size="small" sx={{ color: "error.main" }}>
          {error}
        </Typography>
      )}
    </Box>
  );
};

export const SettingsModal = (props: {
  open: boolean;
  onClose: () => void;
}) => {
  const { open, onClose } = props;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const { actions, safeParse } = useEditorServerActions();
  const { settingsModal, current: currentTemplate } = useTemplate();
  const { refresh } = useRefresh();

  const [template, setTemplate] = useState<Partial<types.TemplateSelect>>();
  const [templateConfig, setTemplateConfig] = useState<types.TemplateConfig>({
    pathMapping: [],
    queryMapping: {},
  });
  const [useWidgetOnly, setUseWidgetOnly] = useState(false);
  const [widgetVariants, setWidgetVariants] = useState<types.WidgetVariants>(
    {}
  );
  const [pageMeta, setPageMeta] = useState<types.TemplatePageMeta>({
    title: "",
    description: "",
  });
  const [pageSlugAlias, setPageSlugAlias] = useState<string[]>([]);
  const [slugError, setSlugError] = useState<string>();
  const [pageSlugAliasError, setPageSlugAliasError] = useState<string>();
  const [editor] = useLexicalComposerContext();
  const [hasConfigurableNodes, setHasConfigurableNodes] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const { wpHooks } = useWP();

  useEffect(() => {
    updateTemplate({
      ID: currentTemplate.template?.ID,
      post_title: currentTemplate.template?.post_title || "",
      post_name: currentTemplate.template?.post_name || "",
      post_status: currentTemplate.template?.post_status || "pending",
    });
    // Clear success message when modal opens with new template
    setSuccessMessage(undefined);
    setError(undefined);
  }, [currentTemplate.template]);

  useEffect(() => {
    const config = currentTemplate.template?.template_config;
    setTemplateConfig(
      config
        ? { pathMapping: config.pathMapping, queryMapping: config.queryMapping }
        : { pathMapping: [], queryMapping: {} }
    );
    setUseWidgetOnly(!!config?.useWidgetOnly);
    setWidgetVariants(config?.widgetVariants ?? {});
  }, [currentTemplate.template]);

  useEffect(() => {
    const currentPageMeta = currentTemplate.template?.page_meta;
    const nextPageMeta: types.TemplatePageMeta = {
      title:
        typeof currentPageMeta?.title === "string" ? currentPageMeta.title : "",
      description:
        typeof currentPageMeta?.description === "string"
          ? currentPageMeta.description
          : "",
    };

    if (currentPageMeta) {
      for (const [key, value] of Object.entries(currentPageMeta)) {
        const trimmedKey = key.trim();
        if (
          !trimmedKey ||
          trimmedKey === "title" ||
          trimmedKey === "description"
        ) {
          continue;
        }

        nextPageMeta[trimmedKey] = value == null ? "" : String(value);
      }
    }

    setPageMeta(nextPageMeta);
  }, [currentTemplate.template?.page_meta]);

  useEffect(() => {
    const templateId = currentTemplate.template?.ID;
    if (!templateId) {
      setPageSlugAlias([]);
      return;
    }
    actions.template.getPageSlugAliases(templateId).then(setPageSlugAlias);
  }, [currentTemplate.template?.ID]);

  useEffect(() => {
    const items = getConfigurableNodeItems(editor);
    setHasConfigurableNodes(items.length > 0);
  }, [editor, open]);

  const updateTemplate = (update: Partial<types.TemplateSelect>) => {
    setTemplate({
      ...template,
      ...update,
    });
  };

  const handleUpdate = async () => {
    const templateId = currentTemplate.template?.ID;

    if (!templateId || !template?.post_title) {
      logger.warn("no template title", template);
      return;
    }

    if (template.post_name && !isValidPageSlug(template.post_name)) {
      setSlugError(
        "Slug must start with a letter or number and contain only lowercase letters, numbers, hyphens, or underscores."
      );
      return;
    }

    for (const alias of pageSlugAlias) {
      if (!isValidPageSlug(alias)) {
        setPageSlugAliasError(
          `Slug alias "${alias}" is invalid. Aliases must start with a letter or number and contain only lowercase letters, numbers, hyphens, or underscores.`
        );
        return;
      }
    }

    setLoading(true);
    setError(undefined);
    setSlugError(undefined);
    setPageSlugAliasError(undefined);
    setSuccessMessage(undefined);

    // Validate that none of the entered aliases are already used by another template
    for (const alias of pageSlugAlias) {
      const exists = await actions.template.pageSlugAliasExists(
        alias,
        templateId
      );
      if (exists) {
        setPageSlugAliasError(
          `Slug alias "${alias}" is already used by another template`
        );
        setLoading(false);
        return;
      }
    }

    const result = await actions.template
      .update(templateId, template.post_title, {
        slug: template.post_name,
        status: template.post_status || "pending",
        config: {
          pathMapping: vals.template.pathMapping(templateConfig.pathMapping),
          queryMapping: vals.template.queryMapping(templateConfig.queryMapping),
          useWidgetOnly,
          // Filter out variants with empty keys (e.g. newly added but not yet named)
          widgetVariants: Object.fromEntries(
            Object.entries(widgetVariants).filter(([key]) => key !== "")
          ),
        },
        pageMeta,
        pageSlugAlias,
      })
      .then(safeParse);

    if (!result.success) {
      logger.error("Error updating template", result.error);
      setError(`${result.error}`);
      setLoading(false);
      return;
    }
    setLoading(false);
    const newTemplateId = result.data as number;
    refresh(["template"]); // refresh template list

    setSuccessMessage("Template updated successfully!");

    wpHooks.action.doCommand(TEMPLATE_SETTINGS_UPDATED_COMMAND, {
      templateId: newTemplateId,
      template: {
        ...template,
        template_config: { ...templateConfig, useWidgetOnly, widgetVariants },
        page_meta: pageMeta,
      },
    });
  };

  const handleClose = () => {
    setSuccessMessage(undefined);
    setError(undefined);
    setSlugError(undefined);
    setPageSlugAliasError(undefined);
    setLoading(false);
    onClose();
  };

  return (
    <>
      <ModalConfirm
        title="Confirm Delete"
        message="Are you sure you want to proceed with this action?"
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        callback={(confirm) => {
          if (confirm) {
            handleUpdate();
          }
          setOpenConfirm(false);
        }}
      />

      <Modal open={open} onClose={handleClose}>
        <ModalContent
          sx={{
            minWidth: "55vw",
            maxHeight: "90%",
            overflowY: "auto",
          }}
        >
          <Typography size="large" bold sx={{ mb: 2 }}>
            Template Settings
          </Typography>
          <form
            onSubmit={(event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              handleUpdate();
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
                width: "100%",
              }}
            >
              {error && <Typography color="danger">{error}</Typography>}
              {successMessage && (
                <Typography color="success">{successMessage}</Typography>
              )}
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Typography size="medium" bold>
                  Template Name
                </Typography>
                <Input
                  size="large"
                  placeholder="Template Name"
                  value={template?.post_title}
                  onChange={(value) => {
                    updateTemplate({
                      //ID: currentTemplate.template?.ID ?? 0,
                      post_title: value,
                      //post_name: template?.post_name ?? "",
                    });
                  }}
                />
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Typography size="medium" bold>
                  Slug
                </Typography>
                <Typography size="small" sx={{ color: "text.secondary" }}>
                  The URL path for this page, accessible at /{"{slug}"}.
                </Typography>
                <Input
                  size="large"
                  placeholder="Slug"
                  readOnly={isErrorSlug(template?.post_name)}
                  value={template?.post_name}
                  onChange={(value) => {
                    setSlugError(undefined);
                    updateTemplate({
                      post_name: value,
                    });
                  }}
                />
                {slugError && (
                  <Typography color="error">{slugError}</Typography>
                )}
              </Box>
              {/* should hide for error templates as they are standalone */}
              {!isErrorSlug(template?.post_name) && !useWidgetOnly && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography size="medium" bold>
                    Slug Aliases
                  </Typography>
                  <Typography size="small" sx={{ color: "text.secondary" }}>
                    Fallback slugs for this template. When accessing a URL like
                    /{"{slug-or-alias}"}, if no page is found by the slug, these
                    aliases are checked next.
                  </Typography>
                  <InputMultiple
                    size="medium"
                    value={pageSlugAlias}
                    onChange={setPageSlugAlias}
                  />
                  {pageSlugAliasError && (
                    <Typography color="error">{pageSlugAliasError}</Typography>
                  )}
                </Box>
              )}
              {!isHomepageSlug(template?.post_name) &&
                !isErrorSlug(template?.post_name) && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 0.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography size="medium" bold>
                        Widget Only
                      </Typography>
                      <Checkbox
                        checked={useWidgetOnly}
                        onChange={(e) => setUseWidgetOnly(e.target.checked)}
                      />
                    </Box>
                    <Typography size="small" sx={{ color: "text.secondary" }}>
                      When enabled, this template is widget-only (no content
                      nodes) and will not be accessible directly via slug or
                      slug alias.
                    </Typography>
                  </Box>
                )}
              {!isHomepageSlug(template?.post_name) &&
                !isErrorSlug(template?.post_name) && (
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <Typography size="medium" bold>
                      Widget Variants
                    </Typography>
                    <Typography size="small" sx={{ color: "text.secondary" }}>
                      Define variables that can be passed to this template when
                      used as a widget. Values are set on each widget instance.
                    </Typography>
                    {Object.entries(widgetVariants).map(
                      ([name, [type, defaultValue]], index) => (
                        <Box
                          key={index}
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                          }}
                        >
                          <VariantNameInput
                            name={name}
                            onRename={(newName) => {
                              const updated = { ...widgetVariants };
                              delete updated[name];
                              updated[newName] = [type, defaultValue];
                              setWidgetVariants(updated);
                            }}
                          />
                          <Box sx={{ width: "30%" }}>
                            {type === "boolean" ? null : (
                              <Input
                                size="medium"
                                value={
                                  defaultValue != null
                                    ? String(defaultValue)
                                    : ""
                                }
                                placeholder="Default Value (optional)"
                                type={type === "number" ? "number" : "text"}
                                onChange={(newDefault) => {
                                  const parsed: string | number | null =
                                    !newDefault
                                      ? null
                                      : type === "number"
                                        ? Number(newDefault)
                                        : newDefault;
                                  setWidgetVariants({
                                    ...widgetVariants,
                                    [name]: [type, parsed],
                                  });
                                }}
                                sx={{ flex: 1, width: "100%" }}
                              />
                            )}
                          </Box>
                          <Select
                            size="medium"
                            value={type}
                            enum={[
                              { label: "String", value: "string" },
                              { label: "Number", value: "number" },
                              { label: "Boolean", value: "boolean" },
                            ]}
                            onChange={(value) => {
                              if (!value) return;
                              setWidgetVariants({
                                ...widgetVariants,
                                [name]: [
                                  value as "string" | "number" | "boolean",
                                  null,
                                ],
                              });
                            }}
                            sx={{ width: "30%" }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              const updated = { ...widgetVariants };
                              delete updated[name];
                              setWidgetVariants(updated);
                            }}
                            sx={{ color: "error.main" }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )
                    )}
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        let newName = "";
                        let counter = 1;
                        while (widgetVariants[newName] !== undefined) {
                          newName = `${counter}`;
                          counter++;
                        }
                        setWidgetVariants({
                          ...widgetVariants,
                          [newName]: ["string", null],
                        });
                      }}
                      sx={{ alignSelf: "flex-start" }}
                    >
                      Add Variant
                    </Button>
                  </Box>
                )}
              {!useWidgetOnly && (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                  }}
                >
                  <Typography size="medium" bold>
                    Status (Visibility)
                  </Typography>
                  <ButtonGroup
                    value={
                      template?.post_status === "publish"
                        ? "publish"
                        : "pending"
                    }
                    enum={[
                      { value: "publish", label: "Visible" },
                      { value: "pending", label: "Hidden" },
                    ]}
                    onChange={(value) => {
                      if (!value) return;
                      updateTemplate({
                        post_status: value,
                      });
                    }}
                    sx={{ width: "100%", textTransform: "none" }}
                    slotSxProps={{
                      buttonLabel: {
                        textTransform: "none",
                        fontWeight: 600,
                      },
                    }}
                  />
                </Box>
              )}
              {!useWidgetOnly && (
                <PageMetaSettings pageMeta={pageMeta} onChange={setPageMeta} />
              )}

              {!hasConfigurableNodes ? (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 1,
                    p: 2,
                    border: "1px solid",
                    borderColor: "warning.main",
                    borderRadius: 1,
                    backgroundColor: "warning.lighter",
                  }}
                >
                  <Typography
                    size="small"
                    bold
                    sx={{ color: "warning.dark", mb: 0.5 }}
                  >
                    Path and Query Mapping Unavailable
                  </Typography>
                  <Typography size="small" sx={{ color: "warning.dark" }}>
                    Path and query mapping are not available because there are
                    no configurable data nodes in the template. Please add a
                    data fetching node (such as a Posts or Terms node) to the
                    template first.
                  </Typography>
                  <Typography
                    size="small"
                    sx={{ color: "warning.dark", mt: 1 }}
                  >
                    Note: To enable mapping, you need to check the checkbox to
                    add
                    <strong> Allowed Query Passthrough Keys </strong> in the
                    data fetching node configuration.
                  </Typography>
                </Box>
              ) : (
                <>
                  <PathMappingSettings
                    pathMapping={templateConfig.pathMapping}
                    onChange={(pathMapping) => {
                      setTemplateConfig({ ...templateConfig, pathMapping });
                    }}
                  />
                  <QueryMappingSettings
                    queryMapping={templateConfig.queryMapping}
                    onChange={(queryMapping) => {
                      setTemplateConfig({
                        ...templateConfig,
                        queryMapping,
                      });
                    }}
                  />
                </>
              )}
              <Button type="submit" loading={loading} size="medium">
                Update
              </Button>
            </Box>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};
