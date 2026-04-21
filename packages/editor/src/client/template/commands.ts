import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";

import type * as types from "../../types";

export const TEMPLATE_ID_UPDATED = createActionCommand<{
  templateId: number;
}>();

export const TEMPLATE_CREATED_COMMAND = createActionCommand<{
  templateId: number;
}>();

export const TEMPLATE_RESET_COMMAND = createActionCommand();

export const TEMPLATE_DELETED_COMMAND = createActionCommand<{
  templateId: number;
}>();

export const TEMPLATE_SETTINGS_UPDATED_COMMAND = createActionCommand<{
  templateId: number;
  template: Partial<types.Template>;
}>();

export const TEMPLATE_PREVIEW_EDITOR_STATE_UPDATED_COMMAND =
  createActionCommand<{
    templateId: number;
    editorStateKey: string;
    infoKey: string;
    previewInfo: types.TemplatePreviewInfo;
    editorStateString: string;
  }>();
