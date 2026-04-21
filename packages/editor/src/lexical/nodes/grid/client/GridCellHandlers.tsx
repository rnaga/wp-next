import { CSSProperties, useEffect } from "react";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useWP } from "@rnaga/wp-next-core/client/wp";

import {
  TOOLBOX_RESIZE_DIRECTIONS,
  TOOLBOX_RESIZE_HANDLER,
} from "../../../../client/mouse-tool/commands";
import { WPLexicalNode } from "../../wp";
import { GridCellNode } from "../GridCellNode";
import {
  $checkAdjustableFrOnGridCell,
  $updateGridFrValueByCell,
} from "../GridNode";

import type * as types from "../../../../types";
import { logger } from "../../../logger";

export const GridCellHandlers = () => {
  const { wpHooks } = useWP();
  const [editor] = useLexicalComposerContext();

  const handleResize =
    (direction: types.ResizeDirection) =>
    (
      node: WPLexicalNode,
      targetElement: HTMLElement,
      diff: { x: number; y: number }
    ): CSSProperties => {
      const { x, y } = diff;
      logger.log( "GridCellToolBox handleMouseMove DIFF", {
        direction,
        node,
        targetElement,
        x,
        y,
      });

      const gridCellNode = node as GridCellNode;

      if (Math.abs(x) > 3 || Math.abs(y) > 3) {
        let diffFr = 0.1;
        switch (direction) {
          case "top":
            diffFr = y > 0 ? -0.5 : 0.5;
            break;
          case "bottom":
            diffFr = y > 0 ? 0.5 : -0.5;
            break;
          case "left":
            diffFr = x > 0 ? -0.15 : 0.15;
            break;
          case "right":
            diffFr = x > 0 ? 0.15 : -0.15;
        }

        editor.update(
          () => {
            $updateGridFrValueByCell(
              editor,
              gridCellNode,
              diffFr,
              direction === "top" || direction === "bottom" ? "row" : "column"
            );
          },
          { discrete: true }
        );
      }

      return {};
    };

  useEffect(() => {
    return wpHooks.filter.addCommand(
      TOOLBOX_RESIZE_HANDLER,
      (handler, args) => {
        const { direction, node, targetElement } = args;

        if (node.getType() !== "grid-cell") return handler;

        return handleResize(direction);
      }
    );
  }, []);

  useEffect(() => {
    return wpHooks.filter.addCommand(
      TOOLBOX_RESIZE_DIRECTIONS,
      (directions, { node }) => {
        if (node.getType() !== "grid-cell") {
          return directions;
        }

        const gridCellNode = node as GridCellNode;

        // Example value - ['bottom', 'right']
        const adjustableFr = editor.read(() =>
          $checkAdjustableFrOnGridCell(gridCellNode)
        );

        const edges = ["top", "right", "bottom", "left"] as const;
        const enabledSet = new Set<string>(
          Array.isArray(adjustableFr)
            ? (adjustableFr as string[])
            : edges.filter((d) => Boolean((adjustableFr as any)?.[d]))
        );
        const disabledDirections = edges.filter((d) => !enabledSet.has(d));

        return {
          enabled: directions.enabled,
          disabled: [
            "corner",
            ...disabledDirections,
          ] as types.ResizeDirection[],
        };
      }
    );
  }, []);

  return null;
};
