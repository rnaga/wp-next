import { COMMAND_PRIORITY_HIGH } from "lexical";
import React, { useEffect, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

import { NODE_CSS_UPDATED_COMMAND } from "../../../lexical/commands";
import { trackEventEnd } from "../../event-utils";
import {
  ButtonGroup,
  FormFlexBox,
  FormStyleControl,
} from "../../forms/components";
import { StyleLengthInputWithCSSVariable } from "../../forms/components/StyleLengthInputWithCSSVariable";
import { createExtractFormData } from "../../forms/utils";
import { useSelectedNode } from "../../global-event";
import { useStyleForm } from "./use-style-form";

const extractFormData = createExtractFormData([
  "width",
  "height",
  "minHeight",
  "maxHeight",
  "minWidth",
  "maxWidth",
  "overflow",
  "boxSizing",
  "objectFit",
]);

// Return true if the value can be parsed as number
// Return true if the value has a valid CSS length value with unit e.g. "100px", "50%", "2em", etc.
const isValidLengthValue = (value: any) => {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }
  const num = parseInt(value, 10);
  return !isNaN(num) && Math.abs(num) >= 0;
};

export const StyleSize = () => {
  const { updateFormData, formDataRef, getFormKey, formKey } = useStyleForm();
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [outOfRange, setOutOfRange] = useState<{
    width: boolean;
    height: boolean;
  }>({
    width: false,
    height: false,
  });

  const [formData, setFormData] = useState<Record<string, string | undefined>>(
    {}
  );

  const handleChange = (name: string) => (value: string | undefined) => {
    updateFormData({ [name]: value });
  };

  useEffect(() => {
    setFormData(extractFormData(formDataRef.current));

    return editor.registerCommand(
      NODE_CSS_UPDATED_COMMAND,
      ({ styles, type }) => {
        if (type !== "mouse" && type !== "keyboard") {
          return false;
        }

        // Filter out undefined values from the styles object
        // This is to ensure that we only update the form data with valid values
        // and avoid unnecessary updates.
        const extracted = Object.fromEntries(
          Object.entries(extractFormData(styles)).filter(
            ([, value]) => value !== undefined
          )
        );

        setFormData((prev) => ({
          ...prev,
          ...extracted,
        }));

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode, formKey]);

  useEffect(() => {
    return editor.registerCommand(
      NODE_CSS_UPDATED_COMMAND,
      ({ styles }) => {
        if (!selectedNode) return false;

        // skip if the styles are not related to size
        if (
          ![
            "width",
            "height",
            "minWidth",
            "maxWidth",
            "minHeight",
            "maxHeight",
          ].some((key) => styles?.[key])
        ) {
          // Clear outOfRange if width/height was explicitly emptied
          setOutOfRange((prev) => ({
            width:
              styles && "width" in styles && !styles.width ? false : prev.width,
            height:
              styles && "height" in styles && !styles.height
                ? false
                : prev.height,
          }));
          return false;
        }

        trackEventEnd(
          "style-size",
          () => {
            const element = editor.getElementByKey(selectedNode.getKey());
            const computedStyle = window.getComputedStyle(element!);

            const styles = {
              width: formDataRef.current.width, //element?.style.getPropertyValue("width") ?? null,
              height: formDataRef.current.height, //element?.style.getPropertyValue("height") ?? null,
            };

            const outOfRange: Array<"width" | "height"> = [];

            // Check if the computedStyle values for min/max-width or min/max-height
            // match the corresponding style values in element in the node.
            // If they match, it indicates that the width/height has reached its min/max limit.
            // Then, compare the computedStyle width/height with the node's style width/height.
            // If they differ, it means the width/height is out of the defined range.
            ["width", "height"].forEach((key) => {
              const dimension = key as "width" | "height";

              const minProp = dimension == "width" ? "minWidth" : "minHeight";
              const maxProp = dimension == "width" ? "maxWidth" : "maxHeight";

              if (
                isValidLengthValue(styles[dimension]) &&
                isValidLengthValue(computedStyle[minProp]) &&
                computedStyle[dimension] === computedStyle[minProp] &&
                computedStyle[dimension] !== styles[dimension]
              ) {
                outOfRange.push(dimension as "width" | "height");
              }

              if (
                isValidLengthValue(styles[dimension]) &&
                isValidLengthValue(computedStyle[maxProp]) &&
                computedStyle[dimension] === computedStyle[maxProp] &&
                computedStyle[dimension] !== styles[dimension]
              ) {
                outOfRange.push(dimension as "width" | "height");
              }
            });

            // Todo: Avoid unnecessary re-rendering
            setOutOfRange({
              width: outOfRange.includes("width"),
              height: outOfRange.includes("height"),
            });
          },
          50,
          {
            counter: 2,
          }
        );
        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, []);

  return (
    <>
      {/* The key prop ensures the component fully re-renders when selectedNode changes */}
      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Width">
          <StyleLengthInputWithCSSVariable
            keyofUsage="width"
            syntax={["length"]}
            key={getFormKey("width")}
            onChange={handleChange("width")}
            value={formData.width}
            outOfRange={outOfRange.width} // Check if width is out of range
          />
        </FormStyleControl>

        <FormStyleControl title="Height">
          <StyleLengthInputWithCSSVariable
            keyofUsage="height"
            syntax={["length"]}
            key={getFormKey("height")}
            onChange={handleChange("height")}
            value={formData.height}
            outOfRange={outOfRange.height} // Check if height is out of range
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Min Height">
          <StyleLengthInputWithCSSVariable
            keyofUsage="minHeight"
            syntax={["length"]}
            key={getFormKey("minHeight")}
            onChange={handleChange("minHeight")}
            value={formData.minHeight}
          />
        </FormStyleControl>
        <FormStyleControl title="Max Height">
          <StyleLengthInputWithCSSVariable
            keyofUsage="maxHeight"
            syntax={["length"]}
            key={getFormKey("maxHeight")}
            onChange={handleChange("maxHeight")}
            value={formData.maxHeight}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Min Width">
          <StyleLengthInputWithCSSVariable
            keyofUsage="minWidth"
            syntax={["length"]}
            key={getFormKey("minWidth")}
            onChange={handleChange("minWidth")}
            value={formData.minWidth}
          />
        </FormStyleControl>
        <FormStyleControl title="Max Width">
          <StyleLengthInputWithCSSVariable
            keyofUsage="maxWidth"
            syntax={["length"]}
            key={getFormKey("maxWidth")}
            onChange={handleChange("maxWidth")}
            value={formData.maxWidth}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Overflow" width="100%">
          <ButtonGroup
            key={getFormKey("overflow")}
            value={formDataRef.current?.overflow}
            onChange={handleChange("overflow")}
            enum={[
              { value: "visible", label: "Visible" },
              { value: "hidden", label: "Hidden" },
              { value: "scroll", label: "Scroll" },
              { value: "clip", label: "Clip" },
              { value: "auto", label: "Auto" },
            ]}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Box Size" width="100%">
          <ButtonGroup
            key={getFormKey("boxSizing")}
            value={formDataRef.current?.["boxSizing"]}
            onChange={handleChange("boxSizing")}
            enum={[
              { value: "content-box", label: "Content Box" },
              { value: "border-box", label: "Border Box" },
            ]}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox>
        <FormStyleControl title="Object Fit" width="100%">
          <ButtonGroup
            key={getFormKey("objectFit")}
            value={formDataRef.current?.["objectFit"]}
            onChange={handleChange("objectFit")}
            enum={[
              { value: "fill", label: "Fill" },
              { value: "contain", label: "Contain" },
              { value: "cover", label: "Cover" },
              { value: "none", label: "None" },
              { value: "scale-down", label: "Scale Down" },
            ]}
          />
        </FormStyleControl>
      </FormFlexBox>
    </>
  );
};
