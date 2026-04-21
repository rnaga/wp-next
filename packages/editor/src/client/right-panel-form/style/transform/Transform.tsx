import { createExtractFormData } from "../../../forms/utils";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useStyleForm } from "../use-style-form";
import {
  ButtonGroup,
  FormFlexBox,
  FormStyleControl,
} from "../../../forms/components";
import { CSSVariableBadge } from "../../../forms/components/CSSVariableBadge";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { NODE_CSS_UPDATED_COMMAND } from "../../../../lexical/commands";
import { COMMAND_PRIORITY_HIGH } from "lexical";
import { useSelectedNode } from "../../../global-event";
import { trackEventEnd } from "../../../event-utils";
import { StyleLengthInput } from "../../../forms/components/StyleLengthInput";
import { LengthInput } from "../../../forms/components/LengthInput";

import type * as types from "../../../../types";
import { Input } from "@rnaga/wp-next-ui/Input";
import { StyleLengthInputWithCSSVariable } from "../../../forms/components/StyleLengthInputWithCSSVariable";
import {
  getTransformFromCSSKeyValue,
  TRANSFORM_CSS_KEY,
} from "../../../../lexical/styles/transform";
import { Box } from "@mui/material";

const extractFormData = createExtractFormData([
  "$type",
  "translateX",
  "translateY",
  "translateZ",
  "scaleX",
  "scaleY",
  "scaleZ",
  "rotate",
  "rotateX",
  "rotateY",
  "rotateZ",
  "skewX",
  "skewY",
  "perspective",
]);

export const Transform = () => {
  const { updateFormData, formDataRef, getFormKey, formKey } = useStyleForm();
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();

  const [formData, setFormData] = useState<Record<string, string | undefined>>({
    $type: "2d",
  });

  const handleChange = (name: string) => (value: string | undefined) => {
    const newFormData = {
      //...getTransformFromCSSKeyValue(formDataRef.current),
      [name]: value,
    } as types.CSSTransform;

    //const transformCSSString = transformValueToCSSString(newFormData);

    updateFormData({
      [TRANSFORM_CSS_KEY]: newFormData,
      //transform: transformCSSString,
    });
  };

  const handleChangeType = (type: string | undefined) => {
    if (type !== "2d" && type !== "3d") {
      return;
    }

    const currentTransform = getTransformFromCSSKeyValue(formDataRef.current);

    // Valid fields for each mode based on UI
    const fields2d = ["rotate", "skewX", "skewY", "perspective"];
    const fields3d = [
      "rotateX",
      "rotateY",
      "rotateZ",
      "skewX",
      "skewY",
      "perspective",
    ];

    // Fields to clear when switching modes
    const fieldsToClear = type === "2d" ? fields3d : fields2d;
    const validFields = type === "2d" ? fields2d : fields3d;

    // Keep valid fields from current transform
    const filteredTransform = currentTransform
      ? Object.fromEntries(
          Object.entries(currentTransform).filter(([key]) =>
            validFields.includes(key)
          )
        )
      : {};

    // Set invalid fields to undefined to remove them
    const clearedFields = Object.fromEntries(
      fieldsToClear
        .filter((key) => !validFields.includes(key))
        .map((key) => [key, undefined])
    );

    const newFormData = {
      ...filteredTransform,
      ...clearedFields,
      $type: type,
    } as types.CSSTransform;

    updateFormData({
      [TRANSFORM_CSS_KEY]: newFormData,
    });

    setFormData(newFormData as Record<string, string | undefined>);
  };

  useEffect(() => {
    setFormData(
      extractFormData(getTransformFromCSSKeyValue(formDataRef.current) ?? {})
    );

    return editor.registerCommand(
      NODE_CSS_UPDATED_COMMAND,
      ({ styles, type, node }) => {
        //if (type !== "mouse") return false;

        // Filter out undefined values from the styles object
        // This is to ensure that we only update the form data with valid values
        // and avoid unnecessary updates.
        const extracted = Object.fromEntries(
          Object.entries(
            extractFormData(getTransformFromCSSKeyValue(styles) ?? {})
          ).filter(([, value]) => value !== undefined)
        );

        // Skip if $__transform values is empty
        if (Object.keys(extracted).length === 0) {
          return false;
        }

        // get the complete style from node
        const nodeStyles = node.__css.get();
        const newTranformStyles = extractFormData(
          getTransformFromCSSKeyValue(nodeStyles) ?? {}
        );

        setFormData(newTranformStyles);

        return false;
      },
      COMMAND_PRIORITY_HIGH
    );
  }, [selectedNode, formKey]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        //gap: 0.5,
      }}
    >
      <FormFlexBox>
        <FormStyleControl title="" width="100%">
          <ButtonGroup
            key={getFormKey("$type")}
            value={formData.$type || "2d"}
            onChange={handleChangeType}
            enum={[
              { value: "2d", label: "2D" },
              { value: "3d", label: "3D" },
            ]}
          />
        </FormStyleControl>
      </FormFlexBox>
      {formData.$type === "3d" && (
        <>
          <FormFlexBox
            sx={{
              mr: 1,
            }}
          >
            <FormStyleControl title="Rotate X">
              <StyleLengthInputWithCSSVariable
                keyofUsage="transform-rotateX"
                syntax={["angle"]}
                key={getFormKey("rotateX")}
                onChange={handleChange("rotateX")}
                value={formData.rotateX}
                includeUnits={["deg"]}
                min={-360}
                max={360}
              />
            </FormStyleControl>

            <FormStyleControl title="Rotate Y">
              <StyleLengthInputWithCSSVariable
                keyofUsage="transform-rotateY"
                syntax={["angle"]}
                key={getFormKey("rotateY")}
                onChange={handleChange("rotateY")}
                value={formData.rotateY}
                includeUnits={["deg"]}
                min={-360}
                max={360}
              />
            </FormStyleControl>
          </FormFlexBox>
          <FormFlexBox
            sx={{
              mr: 1,
            }}
          >
            <FormStyleControl title="Rotate Z">
              <StyleLengthInputWithCSSVariable
                keyofUsage="transform-rotateZ"
                syntax={["angle"]}
                key={getFormKey("rotateZ")}
                onChange={handleChange("rotateZ")}
                value={formData.rotateZ}
                includeUnits={["deg"]}
                min={-360}
                max={360}
              />
            </FormStyleControl>
          </FormFlexBox>
        </>
      )}
      {formData.$type !== "3d" && (
        <FormFlexBox
          sx={{
            mr: 1,
          }}
        >
          <FormStyleControl title="Rotate" width="100%">
            <StyleLengthInputWithCSSVariable
              keyofUsage="transform-rotate"
              syntax={["angle"]}
              key={getFormKey("rotate")}
              onChange={handleChange("rotate")}
              value={formData.rotate}
              includeUnits={["deg"]}
              min={-360}
              max={360}
            />
          </FormStyleControl>
        </FormFlexBox>
      )}

      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Skew X">
          <StyleLengthInputWithCSSVariable
            keyofUsage="transform-skewX"
            syntax={["angle"]}
            key={getFormKey("skewX")}
            onChange={handleChange("skewX")}
            includeUnits={["deg"]}
            min={-100}
            max={100}
            value={formData.skewX}
          />
        </FormStyleControl>

        <FormStyleControl title="Skew Y">
          <StyleLengthInputWithCSSVariable
            keyofUsage="transform-skewY"
            syntax={["angle"]}
            key={getFormKey("skewY")}
            onChange={handleChange("skewY")}
            includeUnits={["deg"]}
            min={-100}
            max={100}
            value={formData.skewY}
          />
        </FormStyleControl>
      </FormFlexBox>
      <FormFlexBox
        sx={{
          mr: 1,
        }}
      >
        <FormStyleControl title="Perspective" width="100%">
          <StyleLengthInputWithCSSVariable
            keyofUsage="transform-perspective"
            syntax={["length"]}
            key={getFormKey("perspective")}
            onChange={handleChange("perspective")}
            value={formData.perspective}
            min={500}
            excludeUnits={["%", "auto"]}
          />
        </FormStyleControl>
      </FormFlexBox>
    </Box>
  );
};
