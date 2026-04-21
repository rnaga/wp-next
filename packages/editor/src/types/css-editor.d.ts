import type { CSSProperties } from "react";

/**
 * CSS properties available for theme/template editing.
 *
 * This type includes only CSS properties that are viewport-independent and suitable
 * for theme-level editing. Properties that are affected by viewport changes (responsive
 * properties) are intentionally excluded because they should be managed through the
 * responsive/breakpoint system rather than being directly editable in the theme editor.
 *
 * @example
 * // Included: viewport-independent properties
 * const themeStyles: CSSEditor = {
 *   backgroundColor: '#fff',
 *   color: '#000',
 *   fontFamily: 'Arial',
 * };
 *
 * @example
 * // Excluded: viewport-dependent properties
 * // ❌ width, height, margin, padding - managed by responsive system
 * // ❌ borderWidth, borderRadius - can vary by viewport
 * // ❌ backgroundSize, backgroundPosition - responsive properties
 */
export type CSSEditor = Pick<
  CSSProperties,
  // ============================================================================
  // COLOR PROPERTIES
  // ============================================================================
  // Colors remain consistent across viewports and are core theme properties.
  // They define the visual identity and branding of the theme.
  | "color"
  | "backgroundColor"
  | "borderColor"
  | "borderTopColor"
  | "borderRightColor"
  | "borderBottomColor"
  | "borderLeftColor"
  | "outlineColor"
  | "caretColor"
  | "columnRuleColor"
  | "textDecorationColor"

  // ============================================================================
  // FONT PROPERTIES
  // ============================================================================
  // Typography properties that define the visual appearance of text.
  // While fontSize could theoretically be viewport-dependent, it's included here
  // as a base theme property (responsive sizing is handled separately).
  | "fontFamily"
  | "fontSize"
  | "fontStyle"
  | "fontVariant"
  | "fontWeight"
  | "fontStretch"
  | "lineHeight"
  | "letterSpacing"
  | "wordSpacing"

  // ============================================================================
  // TEXT PROPERTIES
  // ============================================================================
  // Text styling and layout properties that don't depend on viewport dimensions.
  // These control how text appears and flows, independent of container size.
  | "textAlign"
  | "textDecoration"
  | "textDecorationLine"
  | "textDecorationStyle"
  | "textDecorationThickness"
  | "textTransform"
  | "textShadow"
  | "textIndent"
  | "textOverflow"
  | "whiteSpace"
  | "wordBreak"
  | "wordWrap"
  | "overflowWrap"
  | "hyphens"
  | "textRendering"
  | "verticalAlign"

  // ============================================================================
  // BORDER PROPERTIES
  // ============================================================================
  // Border styles (solid, dashed, dotted, etc.) are viewport-independent.
  // The "border" shorthand is included for convenience, though it contains
  // borderWidth which is technically viewport-dependent. Use with caution or
  // use individual properties (borderColor, borderStyle) for more control.
  | "border"
  | "borderTop"
  | "borderRight"
  | "borderBottom"
  | "borderLeft"
  | "borderStyle"
  | "borderTopStyle"
  | "borderRightStyle"
  | "borderBottomStyle"
  | "borderLeftStyle"
  | "outline"
  | "outlineStyle"

  // ============================================================================
  // BACKGROUND PROPERTIES
  // ============================================================================
  // Background properties that define images and rendering behavior.
  // Excluded: backgroundSize and backgroundPosition (responsive properties).
  | "backgroundImage"
  | "backgroundRepeat"
  | "backgroundAttachment"
  | "backgroundClip"
  | "backgroundOrigin"
  | "backgroundBlendMode"

  // ============================================================================
  // LIST PROPERTIES
  // ============================================================================
  // List styling properties that are viewport-independent.
  | "listStyleType"
  | "listStyleImage"
  | "listStylePosition"

  // ============================================================================
  // VISUAL EFFECT PROPERTIES
  // ============================================================================
  // Properties that control visual appearance, transparency, and user interaction.
  // These are theme-level properties that remain consistent across viewports.
  | "opacity"
  | "visibility"
  | "cursor"
  | "pointerEvents"
  | "userSelect"
  | "mixBlendMode"
  | "isolation"
  | "boxShadow"
  | "filter"
  | "backdropFilter"

  // ============================================================================
  // ANIMATION PROPERTIES
  // ============================================================================
  // Animation timing and behavior properties.
  // Excluded: any properties that define size-based animations (those are responsive).
  | "animationName"
  | "animationDuration"
  | "animationTimingFunction"
  | "animationDelay"
  | "animationIterationCount"
  | "animationDirection"
  | "animationFillMode"
  | "animationPlayState"

  // ============================================================================
  // TRANSITION PROPERTIES
  // ============================================================================
  // Transition timing properties that control animation behavior.
  | "transitionProperty"
  | "transitionDuration"
  | "transitionTimingFunction"
  | "transitionDelay"

  // ============================================================================
  // CONTENT PROPERTIES
  // ============================================================================
  // CSS-generated content and counter properties.
  | "content"
  | "quotes"
  | "counterIncrement"
  | "counterReset"
  | "counterSet"

  // ============================================================================
  // EDITOR-ONLY SIZING PROPERTIES
  // ============================================================================
  // ⚠️  CAUTION: width and height are intentionally excluded from CSSEditor for
  // user-facing theme editing (they are viewport-dependent and managed by the
  // responsive/breakpoint system). These are included here ONLY for internal
  // editor overlay use — e.g. expanding BodyNode to fill the iframe canvas so
  // it is easily selectable during template editing. Never expose these to the
  // theme editor UI or save them as part of the template.
  | "width"
  | "height"
>;

/**
 * Properties excluded from CSSEditor (managed by responsive/breakpoint system):
 *
 * - Layout & Sizing: minWidth, maxWidth, minHeight, maxHeight
 *   (width/height are included but only for internal editor overlay use — see above)
 * - Spacing: margin, padding, gap, rowGap, columnGap
 * - Positioning: top, left, right, bottom, position, inset, zIndex
 * - Flexbox: flex, flexBasis, flexGrow, flexShrink, order, justifyContent, alignItems, etc.
 * - Grid: gridTemplateColumns, gridTemplateRows, gridColumn, gridRow, etc.
 * - Border Sizing: borderWidth, borderRadius, outlineWidth, outlineOffset
 * - Background Sizing: backgroundSize, backgroundPosition
 * - Transform: transform (excluded because it's handled separately in CSSTransform)
 * - Display: display (layout property)
 * - Overflow: overflow, overflowX, overflowY (layout-dependent)
 * - Aspect Ratio: aspectRatio
 * - Object Fit: objectFit, objectPosition (sizing-dependent)
 */
