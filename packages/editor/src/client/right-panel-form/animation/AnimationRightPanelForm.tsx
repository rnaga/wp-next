import { useEffect, useRef, useState } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import AddIcon from "@mui/icons-material/Add";
import { Box, Divider } from "@mui/material";
import { Accordions } from "@rnaga/wp-next-ui/Accordions";
import { Button } from "@rnaga/wp-next-ui/Button";
import { Input } from "@rnaga/wp-next-ui/Input";
import { ListBase } from "@rnaga/wp-next-ui/ListBase";
import { Typography } from "@rnaga/wp-next-ui/Typography";

import {
  $addAnimationPreset,
  $removeAnimationPresetIfNotUsed,
  isPresetKeyframe,
} from "../../../lexical/nodes/animation/AnimationNode";
import { WPLexicalNode } from "../../../lexical/nodes/wp";
import { useDevice } from "../../breakpoint/use-device";
import { EmptyStateMessage } from "../../forms/components";
import { useSelectedNode } from "../../global-event";
import { useStyleForm } from "../style/use-style-form";
import { AnimationCustomProperties } from "./AnimationCustomProperties";
import { AnimationPreview } from "./AnimationPreview";
import { AnimationSelector } from "./AnimationSelector";
import { DraggableKeyframeManager } from "./DraggableKeyframeManager";
import { PseudoElementSelector } from "./PseudoElementSelector";
import { TargetElement } from "./TargetElement";
import { TriggerSelector } from "./TriggerSelector";

import type {
  AnimationPreset,
  AnimationRule,
  AnimationFormData,
  TriggerEvent,
} from "../../../lexical/nodes/animation/types";
import type * as types from "../../../types";
import { RightPanelSectionTitle } from "../../forms/components/RightPanelSectionTitle";
import { HelpText } from "../../forms/components/HelpText";

export const AnimationRightPanelForm = () => {
  const [editor] = useLexicalComposerContext();
  const { selectedNode } = useSelectedNode();
  const [sourceClassName, setSourceClassName] = useState<string>("");
  const [animationFormData, setAnimationFormData] = useState<AnimationFormData>(
    {
      rules: [],
    }
  );
  const { formDataRef, updateFormData } = useStyleForm();

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [showKeyframeManager, setShowKeyframeManager] = useState(false);

  const keyframeManagerButtonRef = useRef<HTMLButtonElement>(null);
  const { device } = useDevice();

  // Get the class name from the selected node and initialize animation form data
  useEffect(() => {
    if (!selectedNode) {
      setSourceClassName("");
      setAnimationFormData({ rules: [] });
      setSelectedRuleId(null);
      return;
    }

    const { className, animations } = editor.read(() => {
      const node = selectedNode.getLatest() as WPLexicalNode;
      return {
        className: node.__css.getClassName(),

        // Animations are stored under the "none" state (the base/default state).
        // State-specific variants like "hover" have their own CSS state elements
        // and are not surfaced in this panel.
        animations:
          node.__css.get({
            state: "none",
          }).__animation || [],
      };
    });

    setSourceClassName(className);

    const rules: AnimationRule[] = animations.map(
      (anim: types.CSSAnimation) =>
        ({
          id: anim.$id,
          sourceElement: className,
          targetElement: anim.$targetElement || "",
          pseudoElement: anim.$pseudoElement || "",
          customProperties: anim.$customProperties,
          trigger: anim.$triggerEvent as TriggerEvent,
          animation: {
            keyframe: anim.$keyframeName,
            duration: parseInt(anim.$duration) || 700,
            delay: parseInt(anim.$delay) || 0,
            timingFunction: anim.$timingFunction || "ease-in-out",
            iterationCount:
              anim.$iterationCount === "infinite"
                ? "infinite"
                : parseInt(anim.$iterationCount) || 1,
            direction: (anim.$direction as any) || "normal",
            fillMode: (anim.$fillMode as any) || "none",
          },
        }) satisfies AnimationRule
    );

    setAnimationFormData({ rules });

    // Reset selected rule when node changes
    setSelectedRuleId(null);
  }, [selectedNode, device]);

  // Create a new empty rule
  const createNewRule = (): AnimationRule => ({
    id: `rule-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    sourceElement: sourceClassName,
    targetElement: "",
    pseudoElement: "",
    customProperties: undefined,
    trigger: "hover",
    animation: {
      keyframe: "bounce",
      duration: 700,
      delay: 0,
      timingFunction: "ease-in-out",
      iterationCount: 1,
      direction: "normal",
      fillMode: "none",
    },
  });

  // Add a new interaction rule
  const handleAddRule = () => {
    const newRule = createNewRule();
    updateAnimationFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, newRule],
    }));

    setSelectedRuleId(newRule.id);

    // Add the animation preset to the editor
    if (
      newRule.animation.keyframe &&
      isPresetKeyframe(newRule.animation.keyframe)
    ) {
      const keyframe = newRule.animation.keyframe;
      editor.update(
        () => {
          $addAnimationPreset(editor, keyframe);
        },
        {
          discrete: true,
        }
      );
    }
  };

  // Delete a rule by index
  const handleDeleteRule = (index: number) => {
    const rule = animationFormData.rules[index];
    const ruleId = rule?.id;
    updateAnimationFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));

    if (selectedRuleId === ruleId) {
      setSelectedRuleId(null);
    }

    // Clean up unused animation preset from the editor
    if (rule.animation.keyframe && isPresetKeyframe(rule.animation.keyframe)) {
      const keyframe = rule.animation.keyframe;
      editor.update(
        () => {
          $removeAnimationPresetIfNotUsed(editor, keyframe, {
            excludeNode: selectedNode,
          });
        },
        {
          discrete: true,
        }
      );
    }
  };

  // Edit a rule by index
  const handleEditRule = (index: number) => {
    const rule = animationFormData.rules[index];
    if (rule) {
      setSelectedRuleId(rule.id);
    }
  };

  // Handle reordering of rules
  const handleChangeOrder = (newValues: AnimationRule[]) => {
    updateAnimationFormData((prev) => ({
      ...prev,
      rules: newValues,
    }));
  };

  // Update a specific rule
  const updateRule = (ruleId: string, updates: Partial<AnimationRule>) => {
    // Determine preset changes before entering the setState updater.
    // editor.update({ discrete: true }) flushes Lexical synchronously, which
    // fires update listeners that call setState on other components. Calling it
    // inside a setState updater risks running during React's render phase and
    // triggering "Cannot update a component while rendering a different component".
    const existingRule = animationFormData.rules.find(
      (rule) => rule.id === ruleId
    );
    const presetChanged =
      updates.animation?.keyframe !== existingRule?.animation.keyframe &&
      isPresetKeyframe(updates.animation?.keyframe) &&
      isPresetKeyframe(existingRule?.animation.keyframe);

    if (presetChanged) {
      const preset = updates.animation!.keyframe! as AnimationPreset;
      const existingPreset = existingRule!.animation
        .keyframe as AnimationPreset;
      editor.update(
        () => {
          $addAnimationPreset(editor, preset);

          $removeAnimationPresetIfNotUsed(editor, existingPreset, {
            excludeNode: selectedNode,
          });
        },
        { discrete: true }
      );
    }

    setAnimationFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      ),
    }));
  };

  const transformAndSyncAnimationData = (formData: AnimationFormData) => {
    if (!selectedNode) {
      return;
    }

    const className = selectedNode.__css.getClassName();

    let animationCSSForm: types.CSSAnimation[] = [];
    for (const rule of formData.rules) {
      animationCSSForm.push({
        $keyframeName: rule.animation.keyframe,
        $type: isPresetKeyframe(rule.animation.keyframe) ? "presets" : "custom",
        $id: rule.id,
        $triggerEvent: rule.trigger,
        $targetElement: rule.targetElement,
        $pseudoElement: rule.pseudoElement || undefined,
        $customProperties:
          rule.customProperties && Object.keys(rule.customProperties).length > 0
            ? rule.customProperties
            : undefined,
        $duration: `${rule.animation.duration}ms`,
        $timingFunction: rule.animation.timingFunction || "ease",
        $delay: `${rule.animation.delay}ms`,
        $iterationCount: rule.animation.iterationCount?.toString() || "1",
        $direction: rule.animation.direction || "normal",
        $fillMode: rule.animation.fillMode || "none",
        $playState: "running",
      });
    }

    updateFormData(
      {
        __animation: animationCSSForm,
      },
      {
        // Animations are stored under the "none" (base) state, not under
        // state-specific elements like "hover" or "focus".
        elementState: "none",
      }
    );
  };

  // Helper function to update animation form data and sync to style form
  const updateAnimationFormData = (
    updater: (prev: AnimationFormData) => AnimationFormData
  ) => {
    setAnimationFormData((prev) => updater(prev));
  };

  // Sync animation data to style form whenever animationFormData changes
  useEffect(() => {
    // Use queueMicrotask to avoid updating Style component during AnimationForm render
    queueMicrotask(() => {
      transformAndSyncAnimationData(animationFormData);
    });
  }, [animationFormData]);

  // Get the currently selected rule
  const selectedRule = animationFormData.rules.find(
    (r) => r.id === selectedRuleId
  );
  const selectedRuleIndex = animationFormData.rules.findIndex(
    (r) => r.id === selectedRuleId
  );

  // Generate accordion items for the selected rule
  const getAccordionItems = () => {
    if (!selectedRule) return [];

    return [
      {
        title: "Trigger Event",
        content: (
          <TriggerSelector
            value={selectedRule.trigger}
            onChange={(value) =>
              updateRule(selectedRule.id, { trigger: value })
            }
          />
        ),
      },
      {
        title: "Keyframe",
        content: (
          <AnimationSelector
            value={selectedRule.animation}
            onChange={(value) =>
              updateRule(selectedRule.id, { animation: value })
            }
          />
        ),
      },
      {
        title: "Target Element (Optional)",
        content: (
          <TargetElement
            value={selectedRule.targetElement || ""}
            onChange={(value) =>
              updateRule(selectedRule.id, { targetElement: value })
            }
          />
        ),
      },
      {
        title: "Pseudo-element (Optional)",
        content: (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <PseudoElementSelector
              value={selectedRule.pseudoElement || ""}
              onChange={(value) =>
                updateRule(selectedRule.id, { pseudoElement: value })
              }
            />
            {/* Custom properties are only relevant when targeting a pseudo-element;
                for the base element they are already available in the Styles tab. */}
            {selectedRule.pseudoElement && (
              <AnimationCustomProperties
                className={sourceClassName}
                value={selectedRule.customProperties}
                onChange={(value) =>
                  updateRule(selectedRule.id, { customProperties: value })
                }
              />
            )}
          </Box>
        ),
      },
    ];
  };

  return (
    <Box sx={{ width: "100%", p: 2, mb: 20 }}>
      <DraggableKeyframeManager
        open={showKeyframeManager}
        onClose={() => setShowKeyframeManager(false)}
        targetRef={keyframeManagerButtonRef}
      />

      <Box
        sx={{
          display: "flex",
          justifyContent: "left",
          alignItems: "flex-start",
          mb: 2,
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Button
          ref={keyframeManagerButtonRef}
          size="small"
          onClick={() => setShowKeyframeManager(true)}
          sx={{
            width: "100%",
          }}
        >
          Manage Custom Keyframes
        </Button>

        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={handleAddRule}
          sx={{
            width: "100%",
          }}
        >
          Add Rule
        </Button>
      </Box>

      {/* List of rules */}
      {animationFormData.rules.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <RightPanelSectionTitle
            title={`Animation Rules (${animationFormData.rules.length})`}
          />

          <ListBase
            items={animationFormData.rules.map((rule, index) => ({
              value: rule,
              label: `Rule ${index + 1}`,
            }))}
            displayType="vertical"
            size="small"
            editable
            onClick={(item) => handleEditRule(item.index)}
            onDelete={handleDeleteRule}
            getItemSx={(item) => ({
              cursor: "pointer",
              backgroundColor:
                selectedRuleIndex === item.index
                  ? "action.selected"
                  : "transparent",
            })}
            renderItem={(item) => {
              const rule = animationFormData.rules[item.index];
              if (!rule) return <></>;

              return (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    py: 0.5,
                    px: 1,
                    gap: 0.5,
                  }}
                >
                  <Typography fontSize={12} fontWeight={500}>
                    {item.label}
                  </Typography>
                  <HelpText>
                    {rule.sourceElement || "No source"}
                    {" → "}
                    {rule.trigger}
                    {" → "}
                    {rule.animation.keyframe || "no keyframe"}
                  </HelpText>
                </Box>
              );
            }}
          />
        </Box>
      )}

      {/* No rules message */}
      {animationFormData.rules.length === 0 && (
        <EmptyStateMessage message='No interaction rules yet. Click "Add Rule" to create your first animation interaction.' />
      )}

      {/* Selected rule configuration */}
      {selectedRule && selectedRuleIndex !== -1 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mt: 2 }}>
            {/* Header showing which rule is being configured */}
            <Box
              sx={{
                mb: 2,
              }}
            >
              <Typography fontSize={14} fontWeight={700}>
                Configuring: Rule {selectedRuleIndex + 1}
              </Typography>
            </Box>

            {/* Animation Preview */}
            <AnimationPreview rule={selectedRule} />

            {/* Source Element - displayed outside accordion */}
            <Box sx={{ width: "100%", mb: 2 }}>
              <Typography fontSize={12} fontWeight={600} sx={{ mb: 1 }}>
                Source Element
              </Typography>
              <Input
                size="small"
                value={selectedRule.sourceElement}
                readOnly={true}
                sx={{ width: "100%" }}
              />
              <HelpText sx={{ mt: 0.5 }}>
                Class name of the currently selected node
              </HelpText>
            </Box>

            <Accordions
              size="small"
              items={getAccordionItems()}
              slotProps={
                {
                  summary: { sx: { px: 0 } },
                  details: { sx: { px: 0 } },
                } as any
              }
            />
          </Box>
        </>
      )}
    </Box>
  );
};
