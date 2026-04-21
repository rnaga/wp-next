import { createExtractFormData } from "../../../forms/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useStyleForm } from "../use-style-form";
import { Transform } from "./Transform";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";

export const StyleTransform = () => {
  return (
    <CSSVariableBadge keyofUsage="transform" syntax={["universal"]}>
      <Transform />
    </CSSVariableBadge>
  );
};
