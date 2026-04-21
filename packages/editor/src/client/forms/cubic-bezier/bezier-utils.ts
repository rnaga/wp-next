import type * as types from "../../../types";
/**
 * Cubic Bezier utility functions
 */

/**
 * Calculate a point on a cubic Bezier curve
 * @param t - Parameter from 0 to 1
 * @param p0 - Start point
 * @param p1 - First control point
 * @param p2 - Second control point
 * @param p3 - End point
 */
export function cubicBezier(
  t: number,
  p0: types.BezierPoint,
  p1: types.BezierPoint,
  p2: types.BezierPoint,
  p3: types.BezierPoint
): types.BezierPoint {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;

  return [
    mt3 * p0[0] + 3 * mt2 * t * p1[0] + 3 * mt * t2 * p2[0] + t3 * p3[0],
    mt3 * p0[1] + 3 * mt2 * t * p1[1] + 3 * mt * t2 * p2[1] + t3 * p3[1],
  ];
}

/**
 * Generate an array of points along a cubic Bezier curve
 */
export function generateBezierPath(
  curve: types.BezierCurve,
  segments: number = 100
): types.BezierPoint[] {
  const p0: types.BezierPoint = [0, 0];
  const p1: types.BezierPoint = [curve[0], curve[1]];
  const p2: types.BezierPoint = [curve[2], curve[3]];
  const p3: types.BezierPoint = [1, 1];

  const points: types.BezierPoint[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    points.push(cubicBezier(t, p0, p1, p2, p3));
  }
  return points;
}

/**
 * Convert cubic bezier values to CSS string
 */
export function bezierToCSSString(curve: types.BezierCurve): string {
  return `cubic-bezier(${curve[0].toFixed(3)}, ${curve[1].toFixed(
    3
  )}, ${curve[2].toFixed(3)}, ${curve[3].toFixed(3)})`;
}

/**
 * Clamp a value between 0 and 1
 */
export function clamp(value: number, min: number = 0, max: number = 1): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Preset easing curves
 */
export const PRESET_CURVES = {
  linear: [0.25, 0.25, 0.75, 0.75] as types.BezierCurve,
  ease: [0.25, 0.1, 0.25, 1] as types.BezierCurve,
  easeIn: [0.42, 0, 1, 1] as types.BezierCurve,
  easeOut: [0, 0, 0.58, 1] as types.BezierCurve,
  easeInOut: [0.42, 0, 0.58, 1] as types.BezierCurve,
  easeInSine: [0.12, 0, 0.39, 0] as types.BezierCurve,
  easeOutSine: [0.61, 1, 0.88, 1] as types.BezierCurve,
  easeInOutSine: [0.37, 0, 0.63, 1] as types.BezierCurve,
  easeInQuad: [0.11, 0, 0.5, 0] as types.BezierCurve,
  easeOutQuad: [0.5, 1, 0.89, 1] as types.BezierCurve,
  easeInOutQuad: [0.45, 0, 0.55, 1] as types.BezierCurve,
  easeInCubic: [0.32, 0, 0.67, 0] as types.BezierCurve,
  easeOutCubic: [0.33, 1, 0.68, 1] as types.BezierCurve,
  easeInOutCubic: [0.65, 0, 0.35, 1] as types.BezierCurve,
  easeInQuart: [0.5, 0, 0.75, 0] as types.BezierCurve,
  easeOutQuart: [0.25, 1, 0.5, 1] as types.BezierCurve,
  easeInOutQuart: [0.76, 0, 0.24, 1] as types.BezierCurve,
  easeInQuint: [0.64, 0, 0.78, 0] as types.BezierCurve,
  easeOutQuint: [0.22, 1, 0.36, 1] as types.BezierCurve,
  easeInOutQuint: [0.83, 0, 0.17, 1] as types.BezierCurve,
  easeInExpo: [0.7, 0, 0.84, 0] as types.BezierCurve,
  easeOutExpo: [0.16, 1, 0.3, 1] as types.BezierCurve,
  easeInOutExpo: [0.87, 0, 0.13, 1] as types.BezierCurve,
  easeInCirc: [0.55, 0, 1, 0.45] as types.BezierCurve,
  easeOutCirc: [0, 0.55, 0.45, 1] as types.BezierCurve,
  easeInOutCirc: [0.85, 0, 0.15, 1] as types.BezierCurve,
  easeInBack: [0.36, 0, 0.66, -0.56] as types.BezierCurve,
  easeOutBack: [0.34, 1.56, 0.64, 1] as types.BezierCurve,
  easeInOutBack: [0.68, -0.6, 0.32, 1.6] as types.BezierCurve,
} as const;

export type PresetCurveName = keyof typeof PRESET_CURVES;

/**
 * Default transition value
 */
export const DEFAULT_TRANSITION_VALUE: types.CSSTransitionValue = {
  $type: "all",
  $cubicBezier: PRESET_CURVES.ease,
  $duration: 300,
};

/**
 * Get preset curve by name
 */
export function getPresetCurve(name: PresetCurveName): types.BezierCurve {
  return PRESET_CURVES[name];
}

/**
 * Get all preset curve names
 */
export function getPresetCurveNames(): PresetCurveName[] {
  return Object.keys(PRESET_CURVES) as PresetCurveName[];
}

/**
 * Format preset name for display
 */
export function formatPresetName(name: string): string {
  // Convert camelCase to Title Case with spaces
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}
