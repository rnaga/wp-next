export type BezierPoint = [number, number];
export type BezierCurve = [number, number, number, number]; // [x1, y1, x2, y2]

export type CSSTransitionValue = {
  $type: string;
  $cubicBezier: BezierCurve;
  $duration: number; // in milliseconds
};

export type CSSPositionValues = {
  top: { value: string; unit: string | null };
  bottom: { value: string; unit: string | null };
  left: { value: string; unit: string | null };
  right: { value: string; unit: string | null };
};
