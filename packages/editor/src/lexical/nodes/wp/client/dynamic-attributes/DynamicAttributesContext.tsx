import { createContext, useContext, useState, useCallback } from "react";

import type {
  DynamicAttributeRule,
  DynamicAttributeCondition,
  DynamicAttributeSettings,
} from "../../../../dynamic-attributes/types";
import { DEFAULT_RULE } from "../../../../dynamic-attributes/types";

interface DynamicAttributesContextValue {
  // The draft rule being edited (not yet saved)
  draftRule: DynamicAttributeRule;
  // Index of the rule being edited (-1 for new)
  editingIndex: number;
  // Whether we're in edit mode
  isEditing: boolean;

  // Actions
  startEditing: (rule: DynamicAttributeRule, index: number) => void;
  startNew: () => void;
  endEditing: () => void;

  // Update draft
  setConditionOperator: (operator: "any" | "all") => void;
  addCondition: () => void;
  updateCondition: (
    index: number,
    field: keyof DynamicAttributeCondition,
    value: string | number
  ) => void;
  removeCondition: (index: number) => void;
  updateSettings: (settings: Partial<DynamicAttributeSettings>) => void;

  // Get the draft for saving
  getDraft: () => DynamicAttributeRule;

  // Adjust editing state after external deletion
  adjustEditingIndexAfterDelete: (deletedIndex: number) => void;
}

const Context = createContext<DynamicAttributesContextValue | null>(null);

export const useDynamicAttributes = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error(
      "useDynamicAttributes must be used within DynamicAttributesProvider"
    );
  }
  return context;
};

export const DynamicAttributesProvider = (props: {
  children: React.ReactNode;
}) => {
  const [draftRule, setDraftRule] = useState<DynamicAttributeRule>({
    ...DEFAULT_RULE,
  });
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = useCallback(
    (rule: DynamicAttributeRule, index: number) => {
      setDraftRule(structuredClone(rule));
      setEditingIndex(index);
      setIsEditing(true);
    },
    []
  );

  const startNew = useCallback(() => {
    setDraftRule({
      conditionOperator: "all",
      conditions: [],
      settings: {
        display: true,
        externalClassnames: undefined,
        customAttributes: {},
      },
    });
    setEditingIndex(-1);
    setIsEditing(true);
  }, []);

  const endEditing = useCallback(() => {
    setIsEditing(false);
    setEditingIndex(-1);
    setDraftRule({ ...DEFAULT_RULE });
  }, []);

  const setConditionOperator = useCallback((operator: "any" | "all") => {
    setDraftRule((prev) => ({
      ...prev,
      conditionOperator: operator,
    }));
  }, []);

  const addCondition = useCallback(() => {
    setDraftRule((prev) => ({
      ...prev,
      conditions: [
        ...prev.conditions,
        {
          type: "data-fetching",
          key: "",
          operator: "equals",
          value: "",
        },
      ],
    }));
  }, []);

  const updateCondition = useCallback(
    (
      index: number,
      field: keyof DynamicAttributeCondition,
      value: string | number
    ) => {
      setDraftRule((prev) => {
        const newConditions = [...prev.conditions];
        newConditions[index] = {
          ...newConditions[index],
          [field]: value,
        };
        return {
          ...prev,
          conditions: newConditions,
        };
      });
    },
    []
  );

  const removeCondition = useCallback((index: number) => {
    setDraftRule((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
    }));
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<DynamicAttributeSettings>) => {
      setDraftRule((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...settings,
        },
      }));
    },
    []
  );

  const getDraft = useCallback(() => {
    return draftRule;
  }, [draftRule]);

  const adjustEditingIndexAfterDelete = useCallback((deletedIndex: number) => {
    setEditingIndex((prev) => {
      if (prev === -1) return prev;
      if (prev === deletedIndex) {
        setIsEditing(false);
        setDraftRule({ ...DEFAULT_RULE });
        return -1;
      }
      if (prev > deletedIndex) {
        return prev - 1;
      }
      return prev;
    });
  }, []);

  return (
    <Context.Provider
      value={{
        draftRule,
        editingIndex,
        isEditing,
        startEditing,
        startNew,
        endEditing,
        setConditionOperator,
        addCondition,
        updateCondition,
        removeCondition,
        updateSettings,
        getDraft,
        adjustEditingIndexAfterDelete,
      }}
    >
      {props.children}
    </Context.Provider>
  );
};
