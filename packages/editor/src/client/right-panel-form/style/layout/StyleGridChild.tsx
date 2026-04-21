import { useCallback, useEffect, useMemo, useState } from "react";

import { FormFlexBox, FormStyleControl } from "../../../forms/components";
import { Input } from "@rnaga/wp-next-ui/Input";
import {
  createExtractFormData,
  createTransformFormDataValue,
} from "../../../forms/utils";
import { useStyleForm } from "../use-style-form";
import { ButtonGroup } from "../../../forms/components/ButtonGroup";
import { useSelectedNode } from "../../../global-event";

const extractFormData = createExtractFormData(
  [
    "gridColumnStart",
    "gridColumnEnd",
    "gridRowStart",
    "gridRowEnd",
    "gridColumn",
    "gridRow",
    "order",
  ],
  "__layout"
);

type PositionMode = "auto" | "manual";
type OrderMode = "first" | "last" | "manual";

export const StyleGridChild = () => {
  const { formDataRef, updateFormData } = useStyleForm();
  const { selectedNode } = useSelectedNode();

  const transformValue = useMemo(
    () => createTransformFormDataValue(extractFormData(formDataRef.current)),
    [formDataRef.current, selectedNode]
  );

  const [positionMode, setPositionMode] = useState<PositionMode>("auto");
  const [orderMode, setOrderMode] = useState<OrderMode>("manual");

  // Extract current values
  const currentFormData = extractFormData(formDataRef.current);

  // Auto mode: column-span and row-span
  const [columnSpan, setColumnSpan] = useState<string>("1");
  const [rowSpan, setRowSpan] = useState<string>("1");

  // Manual mode: start/end values
  const [columnStart, setColumnStart] = useState<string>("");
  const [columnEnd, setColumnEnd] = useState<string>("");
  const [rowStart, setRowStart] = useState<string>("");
  const [rowEnd, setRowEnd] = useState<string>("");

  // Order value
  const [orderValue, setOrderValue] = useState<string>("0");

  // Initialize values from form data
  useEffect(() => {
    const gridColumn = currentFormData?.["gridColumn"];
    const gridRow = currentFormData?.["gridRow"];
    const gridColumnStart = currentFormData?.["gridColumnStart"];
    const gridColumnEnd = currentFormData?.["gridColumnEnd"];
    const gridRowStart = currentFormData?.["gridRowStart"];
    const gridRowEnd = currentFormData?.["gridRowEnd"];
    const order = currentFormData?.["order"];

    // Determine position mode based on existing values
    if (gridColumnStart || gridColumnEnd || gridRowStart || gridRowEnd) {
      setPositionMode("manual");
      setColumnStart(gridColumnStart || "");
      setColumnEnd(gridColumnEnd || "");
      setRowStart(gridRowStart || "");
      setRowEnd(gridRowEnd || "");
    } else if (gridColumn || gridRow) {
      setPositionMode("auto");
      // Parse span values from grid-column/grid-row (e.g., "span 2")
      const colMatch = gridColumn?.match(/span (\d+)/);
      const rowMatch = gridRow?.match(/span (\d+)/);
      setColumnSpan(colMatch ? colMatch[1] : "1");
      setRowSpan(rowMatch ? rowMatch[1] : "1");
    }

    // Handle order
    if (order === "-1") {
      setOrderMode("first");
    } else if (order === "999") {
      setOrderMode("last");
    } else {
      setOrderMode("manual");
      setOrderValue(order || "0");
    }
  }, []);

  const handlePositionModeChange = (value: string | undefined) => {
    if (!value) return;
    setPositionMode(value as PositionMode);

    // Clear previous values when switching modes
    const newFormData = { ...extractFormData(formDataRef.current) };

    if (value === "auto") {
      // Remove manual properties and set span properties
      delete newFormData["gridColumnStart"];
      delete newFormData["gridColumnEnd"];
      delete newFormData["gridRowStart"];
      delete newFormData["gridRowEnd"];
      newFormData["gridColumn"] = `span ${columnSpan}`;
      newFormData["gridRow"] = `span ${rowSpan}`;
    } else {
      // Remove span properties and set manual properties
      delete newFormData["gridColumn"];
      delete newFormData["gridRow"];
      if (columnStart) newFormData["gridColumnStart"] = columnStart;
      if (columnEnd) newFormData["gridColumnEnd"] = columnEnd;
      if (rowStart) newFormData["gridRowStart"] = rowStart;
      if (rowEnd) newFormData["gridRowEnd"] = rowEnd;
    }

    updateFormData({ __layout: newFormData });
  };

  const handleColumnSpanChange = (value: string) => {
    setColumnSpan(value);
    const newFormData = {
      ...extractFormData(formDataRef.current),
      gridColumn: `span ${value}`,
    };
    updateFormData({ __layout: newFormData });
  };

  const handleRowSpanChange = (value: string) => {
    setRowSpan(value);
    const newFormData = {
      ...extractFormData(formDataRef.current),
      gridRow: `span ${value}`,
    };
    updateFormData({ __layout: newFormData });
  };

  const handleColumnStartChange = (value: string) => {
    setColumnStart(value);
    const newFormData = {
      ...extractFormData(formDataRef.current),
      gridColumnStart: value,
    };
    updateFormData({ __layout: newFormData });
  };

  const handleColumnEndChange = (value: string) => {
    setColumnEnd(value);
    const newFormData = {
      ...extractFormData(formDataRef.current),
      gridColumnEnd: value,
    };
    updateFormData({ __layout: newFormData });
  };

  const handleRowStartChange = (value: string) => {
    setRowStart(value);
    const newFormData = {
      ...extractFormData(formDataRef.current),
      gridRowStart: value,
    };
    updateFormData({ __layout: newFormData });
  };

  const handleRowEndChange = (value: string) => {
    setRowEnd(value);
    const newFormData = {
      ...extractFormData(formDataRef.current),
      gridRowEnd: value,
    };
    updateFormData({ __layout: newFormData });
  };

  const handleOrderModeChange = (value: string | undefined) => {
    if (!value) return;
    setOrderMode(value as OrderMode);

    const newFormData = { ...extractFormData(formDataRef.current) };

    if (value === "first") {
      newFormData["order"] = "-1";
    } else if (value === "last") {
      newFormData["order"] = "999";
    } else {
      newFormData["order"] = orderValue;
    }

    updateFormData({ __layout: newFormData });
  };

  const handleOrderValueChange = (value: string) => {
    setOrderValue(value);
    const newFormData = {
      ...extractFormData(formDataRef.current),
      order: value,
    };
    updateFormData({ __layout: newFormData });
  };

  return (
    <>
      <FormFlexBox>
        <FormStyleControl title="Position" width="100%">
          <ButtonGroup
            key="position-mode"
            onChange={handlePositionModeChange}
            enum={[
              { value: "auto", label: "Auto" },
              { value: "manual", label: "Manual" },
            ]}
            value={positionMode}
          />
        </FormStyleControl>
      </FormFlexBox>

      {positionMode === "auto" && (
        <FormFlexBox>
          <FormStyleControl title="Column Span">
            <Input
              key="column-span"
              onChange={handleColumnSpanChange}
              value={columnSpan}
              type="number"
            />
          </FormStyleControl>
          <FormStyleControl title="Row Span">
            <Input
              key="row-span"
              onChange={handleRowSpanChange}
              value={rowSpan}
              type="number"
            />
          </FormStyleControl>
        </FormFlexBox>
      )}

      {positionMode === "manual" && (
        <>
          <FormFlexBox>
            <FormStyleControl title="Column Start">
              <Input
                key="column-start"
                onChange={handleColumnStartChange}
                value={columnStart}
                type="text"
              />
            </FormStyleControl>
            <FormStyleControl title="Column End">
              <Input
                key="column-end"
                onChange={handleColumnEndChange}
                value={columnEnd}
                type="text"
              />
            </FormStyleControl>
          </FormFlexBox>
          <FormFlexBox>
            <FormStyleControl title="Row Start">
              <Input
                key="row-start"
                onChange={handleRowStartChange}
                value={rowStart}
                type="text"
              />
            </FormStyleControl>
            <FormStyleControl title="Row End">
              <Input
                key="row-end"
                onChange={handleRowEndChange}
                value={rowEnd}
                type="text"
              />
            </FormStyleControl>
          </FormFlexBox>
        </>
      )}

      <FormFlexBox>
        <FormStyleControl title="Order" width="100%">
          <ButtonGroup
            key="order-mode"
            onChange={handleOrderModeChange}
            enum={[
              { value: "first", label: "First" },
              { value: "last", label: "Last" },
              { value: "manual", label: "Manual" },
            ]}
            value={orderMode}
          />
        </FormStyleControl>
      </FormFlexBox>

      {orderMode === "manual" && (
        <FormFlexBox>
          <FormStyleControl title="Order Value" width="100%">
            <Input
              key="order-value"
              onChange={handleOrderValueChange}
              value={orderValue}
              type="number"
            />
          </FormStyleControl>
        </FormFlexBox>
      )}
    </>
  );
};
