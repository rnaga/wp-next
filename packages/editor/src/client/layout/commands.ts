import { createActionCommand } from "@rnaga/wp-node/common/hooks-command";

export const MAIN_AREA_LOADED_COMMAND = createActionCommand<{
  mainArea: HTMLDivElement;
}>();

export const MAIN_AREA_LOADED_CLICKED_COMMAND = createActionCommand<void>();

export const CLOSE_LEFT_PANEL_COMMAND = createActionCommand<void>();
