import { getServerActionsUtils } from "@rnaga/wp-next-core/server/utils/get-server-actions-utils";
import * as actionsTemplate from "./template";
import * as actionsFont from "./font";
import * as actionsCustomCode from "./custom-code";
import * as actionsCSSVariables from "./css-variables";
import * as actionDataFetching from "./data-fetching";
import * as types from "../../types";

export const getEditorServerActionsUtils = () => {
  const serverActionsUtils = getServerActionsUtils();

  const actions = {
    ...serverActionsUtils.actions,
    template: actionsTemplate,
    font: actionsFont,
    customCode: actionsCustomCode,
    cssVariables: actionsCSSVariables,
    dataFetching: actionDataFetching,
  };

  return {
    ...serverActionsUtils,
    actions,
  };
};
