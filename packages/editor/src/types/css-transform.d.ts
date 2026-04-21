export type CSSTransform2DValue = {
  $type: "2d";
  translateX?: string; // e.g., "10px", "5%"
  translateY?: string; // e.g., "10px", "5%"
  scaleX?: number; // e.g., 1.0, 2.0
  scaleY?: number; // e.g., 1.0, 2.0
  rotate?: string; // e.g., "45deg", "0.785rad"
  skewX?: string; // e.g., "10deg", "0.174rad"
  skewY?: string; // e.g., "10deg", "0.174rad"
};

export type CSSTransform3DValue = {
  $type: "3d";
  translateX?: string; // e.g., "10px", "5%"
  translateY?: string; // e.g., "10px", "5%"
  translateZ?: string; // e.g., "10px", "5%"
  scaleX?: number; // e.g., 1.0, 2.0
  scaleY?: number; // e.g., 1.0, 2.0
  scaleZ?: number; // e.g., 1.0, 2.0
  rotateX?: string; // e.g., "45deg", "0.785rad"
  rotateY?: string; // e.g., "45deg", "0.785rad"
  rotateZ?: string; // e.g., "45deg", "0.785rad"
  skewX?: string; // e.g., "10deg", "0.174rad"
  skewY?: string; // e.g., "10deg", "0.174rad"
};

// export type CSSTransformValue<T extends "2d" | "3d"> = T extends "2d"
//   ? CSSTransform2DValue
//   : CSSTransform3DValue;
