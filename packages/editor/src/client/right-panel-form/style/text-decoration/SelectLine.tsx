import {
  SelectMultiple,
  type SelectMultipleItem,
} from "@rnaga/wp-next-ui/SelectMultiple";
import React, { useState, useCallback, useEffect } from "react";
import { useStyleForm } from "../use-style-form";

// All keywords accepted by the CSS `text-decoration-line` property
export const TEXT_DECORATION_ITEMS = [
  { label: "none", id: "none" },
  { label: "underline", id: "underline" },
  { label: "overline", id: "overline" },
  { label: "line-through", id: "line-through" },
  { label: "blink", id: "blink" },
  { label: "spelling-error", id: "spelling-error" },
  { label: "grammar-error", id: "grammar-error" },
  { label: "inherit", id: "inherit" },
  { label: "initial", id: "initial" },
  { label: "unset", id: "unset" },
  { label: "revert", id: "revert" },
  { label: "revert-layer", id: "revert-layer" },
];

const EXCLUSIVE_KEYS = new Set<string>([
  "none",
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  "spelling-error",
  "grammar-error",
  "blink",
]);

export const SelectLine = () => {
  const { formDataRef, updateFormData } = useStyleForm();
  const [value, setValue] = useState<typeof TEXT_DECORATION_ITEMS>([]);

  useEffect(() => {
    const newValue = formDataRef.current.textDecorationLine?.split(" ") ?? [];

    const selected = newValue.map((item: string | SelectMultipleItem) =>
      typeof item === "string" ? { label: item, id: item } : item
    );

    setValue(selected);
  }, [formDataRef.current.textDecorationLine]);

  const normalize = (vals: SelectMultipleItem[]): SelectMultipleItem[] => {
    // Get the last value which is the newest one
    const lastValue = vals[vals.length - 1];

    // Check if the last value is an exclusive key
    if (EXCLUSIVE_KEYS.has(lastValue?.id)) {
      // If it is, remove all other values
      return [lastValue];
    }

    // Filter exclusive keys from the current value
    return [...vals].filter((v) => !EXCLUSIVE_KEYS.has(v.id));
  };

  return (
    <SelectMultiple
      items={TEXT_DECORATION_ITEMS}
      value={value}
      onChange={(items) => {
        const newValue = normalize(items);

        setValue(newValue);
        //onChange(newValue);

        updateFormData({
          textDecorationLine: newValue.map((v) => v.id).join(" "),
        });
      }}
    />
  );
};
