import * as actionsCustomCode from "../../server/actions/custom-code";
import * as actionsTemplate from "../../server/actions/template";
import * as actionsPreview from "../../server/actions/preview";
import * as actionsFont from "../../server/actions/font";
import * as actionsCSSVariables from "../../server/actions/css-variables";
import * as actionsDataFetching from "../../server/actions/data-fetching";
import { useAdminServerActions } from "@rnaga/wp-next-admin/client/hooks/use-admin-server-actions";

export const useEditorServerActions = () => {
  const adminServerActions = useAdminServerActions();

  const actions = {
    ...adminServerActions.actions,
    customCode: actionsCustomCode,
    template: actionsTemplate,
    preview: actionsPreview,
    font: actionsFont,
    cssVariables: actionsCSSVariables,
    dataFetching: actionsDataFetching,
  };

  return {
    ...adminServerActions,
    actions,
  };
};
