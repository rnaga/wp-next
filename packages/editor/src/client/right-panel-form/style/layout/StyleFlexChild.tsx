import { useState, useMemo, useEffect } from "react";
import {
  createExtractFormData,
  createTransformFormDataValue,
} from "../../../forms/utils";
import { useStyleForm } from "../use-style-form";
import {
  ButtonGroup,
  FormFlexBox,
  FormStyleControl,
} from "../../../forms/components";
import { Input } from "@rnaga/wp-next-ui/Input";
import { useSelectedNode } from "../../../global-event";

const extractFormData = createExtractFormData(
  ["flexGrow", "flexShrink", "flexBasis", "flex", "order"],
  "__flexChild"
);

type SizingMode = "grow" | "shrink" | "none" | "flex";

export const StyleFlexChild = () => {
  const { formDataRef, updateFormData } = useStyleForm();
  const { selectedNode } = useSelectedNode();

  // Initialize all hooks with static default values
  const [sizingMode, setSizingMode] = useState<SizingMode>("none");
  const [flexGrow, setFlexGrow] = useState("1");
  const [flexShrink, setFlexShrink] = useState("1");
  const [flexBasis, setFlexBasis] = useState("auto");
  const [orderMode, setOrderMode] = useState<
    "first" | "last" | "custom" | undefined
  >(undefined);
  const [customOrder, setCustomOrder] = useState("0");

  const transformValue = useMemo(
    () => createTransformFormDataValue(extractFormData(formDataRef.current)),
    [formDataRef.current, selectedNode]
  );

  // Determine the current sizing mode
  const getCurrentSizingMode = (): SizingMode => {
    const data = extractFormData(formDataRef.current);
    if (data?.flex) return "flex";
    if (data?.["flexGrow"] === "1" && !data?.["flexShrink"]) return "grow";
    if (data?.["flexShrink"] === "1" && !data?.["flexGrow"]) return "shrink";
    return "none";
  };

  const getCurrentOrderMode = (): "first" | "last" | "custom" | undefined => {
    const order = transformValue("order", String, undefined);
    if (!order) return undefined;
    if (order === "-9999") return "first";
    if (order === "9999") return "last";
    return "custom";
  };

  const handleSizingChange = (value: string | undefined) => {
    if (!value) {
      // Reset to none
      setSizingMode("none");
      updateFormData({
        __flexChild: {
          ...extractFormData(formDataRef.current),
          flex: undefined,
          flexGrow: undefined,
          flexShrink: undefined,
          flexBasis: undefined,
        },
      });
      return;
    }

    const mode = value as SizingMode;
    setSizingMode(mode);

    const currentData = extractFormData(formDataRef.current);

    switch (mode) {
      case "grow":
        updateFormData({
          __flexChild: {
            ...currentData,
            flexGrow: "1",
            flexShrink: undefined,
            flex: undefined,
          },
        });
        break;
      case "shrink":
        updateFormData({
          __flexChild: {
            ...currentData,
            flexGrow: undefined,
            flexShrink: "1",
            flex: undefined,
          },
        });
        break;
      case "none":
        updateFormData({
          __flexChild: {
            ...currentData,
            flexGrow: undefined,
            flexShrink: undefined,
            flex: undefined,
          },
        });
        break;
      case "flex":
        // Set default flex values
        const grow = flexGrow || "1";
        const shrink = flexShrink || "1";
        const basis = flexBasis || "auto";
        updateFormData({
          __flexChild: {
            ...currentData,
            flex: `${grow} ${shrink} ${basis}`,
            flexGrow: undefined,
            flexShrink: undefined,
            flexBasis: undefined,
          },
        });
        break;
    }
  };

  const handleFlexGrowChange = (value: string) => {
    setFlexGrow(value);
    updateFlexValue(value, flexShrink, flexBasis);
  };

  const handleFlexShrinkChange = (value: string) => {
    setFlexShrink(value);
    updateFlexValue(flexGrow, value, flexBasis);
  };

  const handleFlexBasisChange = (value: string) => {
    setFlexBasis(value);
    updateFlexValue(flexGrow, flexShrink, value);
  };

  const updateFlexValue = (grow: string, shrink: string, basis: string) => {
    const currentData = extractFormData(formDataRef.current);
    updateFormData({
      __flexChild: {
        ...currentData,
        flex: `${grow || "0"} ${shrink || "0"} ${basis || "auto"}`,
      },
    });
  };

  const handleOrderChange = (value: string | undefined) => {
    if (!value) {
      setOrderMode(undefined);
      updateFormData({
        __flexChild: {
          ...extractFormData(formDataRef.current),
          order: undefined,
        },
      });
      return;
    }

    const mode = value as "first" | "last" | "custom";
    setOrderMode(mode);

    const currentData = extractFormData(formDataRef.current);

    switch (mode) {
      case "first":
        updateFormData({
          __flexChild: {
            ...currentData,
            order: "-9999",
          },
        });
        break;
      case "last":
        updateFormData({
          __flexChild: {
            ...currentData,
            order: "9999",
          },
        });
        break;
      case "custom":
        updateFormData({
          __flexChild: {
            ...currentData,
            order: customOrder || "0",
          },
        });
        break;
    }
  };

  const handleCustomOrderChange = (value: string) => {
    setCustomOrder(value);
    const currentData = extractFormData(formDataRef.current);
    updateFormData({
      __flexChild: {
        ...currentData,
        order: value,
      },
    });
  };

  // Update state values from form data
  useEffect(() => {
    if (!selectedNode) {
      return;
    }
    setSizingMode(getCurrentSizingMode());
    setFlexGrow(transformValue("flexGrow", String, "1"));
    setFlexShrink(transformValue("flexShrink", String, "1"));
    setFlexBasis(transformValue("flexBasis", String, "auto"));
    setOrderMode(getCurrentOrderMode());
    setCustomOrder(transformValue("order", String, "0"));
  }, [transformValue, selectedNode]);

  return (
    <>
      <FormFlexBox>
        <FormStyleControl title="Sizing" width="100%">
          <ButtonGroup
            value={sizingMode}
            onChange={handleSizingChange}
            enum={[
              { value: "grow", label: "Grow", tooltip: "flex-grow: 1" },
              { value: "shrink", label: "Shrink", tooltip: "flex-shrink: 1" },
              {
                value: "none",
                label: "None",
                tooltip: "No flex grow or shrink",
              },
              {
                value: "flex",
                label: "Flex",
                tooltip: "Custom flex values",
              },
            ]}
            showCount={4}
            fontSize={10}
          />
        </FormStyleControl>
      </FormFlexBox>

      {sizingMode === "flex" && (
        <FormFlexBox>
          <FormStyleControl title="Grow">
            <Input
              type="number"
              value={flexGrow}
              onChange={handleFlexGrowChange}
              size="small"
            />
          </FormStyleControl>
          <FormStyleControl title="Shrink">
            <Input
              type="number"
              value={flexShrink}
              onChange={handleFlexShrinkChange}
              size="small"
            />
          </FormStyleControl>
          <FormStyleControl title="Basis">
            <Input
              value={flexBasis}
              onChange={handleFlexBasisChange}
              size="small"
              placeholder="auto, 200px, etc."
            />
          </FormStyleControl>
        </FormFlexBox>
      )}

      <FormFlexBox>
        <FormStyleControl title="Order" width="100%">
          <ButtonGroup
            value={orderMode}
            onChange={handleOrderChange}
            enum={[
              { value: "first", label: "First", tooltip: "order: -9999" },
              { value: "last", label: "Last", tooltip: "order: 9999" },
              {
                value: "custom",
                label: "Custom",
                tooltip: "Enter custom order value",
              },
            ]}
            showCount={3}
            fontSize={10}
          />
        </FormStyleControl>
      </FormFlexBox>

      {orderMode === "custom" && (
        <FormFlexBox>
          <FormStyleControl title="Order Value" width="100%">
            <Input
              type="number"
              value={customOrder}
              onChange={handleCustomOrderChange}
              size="small"
              placeholder="0"
            />
          </FormStyleControl>
        </FormFlexBox>
      )}
    </>
  );
};
