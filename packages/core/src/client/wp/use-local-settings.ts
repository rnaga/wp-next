"use client";
import * as types from "../../types";
import { useState } from "react";

export const useLocalSettingsState = () => {
  let initialLocalSettings = {};
  try {
    initialLocalSettings = JSON.parse(
      localStorage.getItem("wp-local-settings") ?? "{}"
    );
  } catch (e) {}

  const [localSettings, setStateLocalSettings] =
    useState<Partial<types.client.LocalSettings>>(initialLocalSettings);

  const setLocalSettings = (settings: Partial<types.client.LocalSettings>) => {
    const newSettings = { ...localSettings, ...settings };
    try {
      localStorage.setItem("wp-local-settings", JSON.stringify(newSettings));
    } catch (e) {}
    setStateLocalSettings(newSettings);
  };

  return { localSettings, setLocalSettings };
};
