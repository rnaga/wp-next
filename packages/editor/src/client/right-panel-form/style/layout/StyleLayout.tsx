import { useEffect, useState } from "react";

import { useStyleForm } from "../use-style-form";
import { ButtonGroup } from "../../../forms/components";
import { StyleFlex } from "./StyleFlex";
import { StyleGrid } from "./StyleGrid";
import { StyleFlexChild } from "./StyleFlexChild";

export const StyleLayout = () => {
  const { formDataRef, updateFormData, formKey } = useStyleForm();
  const [display, setDisplay] = useState(
    formDataRef.current.__layout?.display || "block"
  );

  const handleChange = (value: string | undefined) => {
    if (!value) {
      updateFormData({ __layout: { display: null } });
      return;
    }

    // If the display value is changed, we need to remove the grid or flex properties
    if (
      (display?.includes("flex") && !value?.includes("flex")) ||
      (display?.includes("grid") && !value?.includes("grid"))
    ) {
      updateFormData({ __layout: { display: value } });
    } else {
      updateFormData({
        __layout: { ...formDataRef.current.__layout, display: value },
      });
    }
    setDisplay(value);
  };

  // Use formKey (not selectedNode) as the dependency so that formDataRef.current
  // is already updated by StyleFormContext's syncFormData() before this effect runs.
  // Effects fire bottom-up (child before parent), so depending on selectedNode would
  // read stale ref data — formKey is set after syncFormData() completes.
  useEffect(() => {
    const currentDisplay = formDataRef.current.__layout?.display;
    setDisplay(currentDisplay || "block");
  }, [formKey]);

  return (
    <>
      <ButtonGroup
        value={display}
        onChange={handleChange}
        enum={[
          { value: "block", label: "Block" },
          { value: "flex", label: "Flex" },
          { value: "grid", label: "Grid" },
          { value: "inline", label: "Inline" },
          { value: "inline-block", label: "Inline Block" },
          { value: "inline-flex", label: "Inline Flex" },
          { value: "inline-grid", label: "Inline Grid" },
          { value: "none", label: "None" },
        ]}
      />
      {display === "grid" || display === "inline-grid" ? (
        <StyleGrid display={display as "grid" | "inline-grid"} />
      ) : display === "flex" || display === "inline-flex" ? (
        <StyleFlex display={display as "flex" | "inline-flex"} />
      ) : null}
    </>
  );
};
