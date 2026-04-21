import { useEffect } from "react";
import { SettingsDataFetchingForm } from "./SettingsDataFetchingForm";
import { SettingsDataFetchingNode } from "../SettingsDataFetchingNode";
import { registerDataFetchingForm } from "../../data-fetching/client/DataFetchingForm";

export const SettingsDataFetchingPlugin = () => {
  useEffect(() => {
    registerDataFetchingForm(SettingsDataFetchingNode.getType(), {
      title: "Settings",
      component: SettingsDataFetchingForm,
    });
  }, []);

  return null;
};
