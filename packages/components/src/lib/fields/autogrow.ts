/**
 * Internal: the arithmetic behind `Textarea`'s `autoGrow`. Not exported from
 * any barrel.
 *
 * @module
 */

/** The subset of `CSSStyleDeclaration` the measurement reads. */
type Measured = Pick<
  CSSStyleDeclaration,
  | 'lineHeight'
  | 'fontSize'
  | 'paddingTop'
  | 'paddingBottom'
  | 'borderTopWidth'
  | 'borderBottomWidth'
  | 'boxSizing'
>;

/** A `line-height` of `normal` is about 1.2 times the font size in every engine. */
const NORMAL_LINE_HEIGHT = 1.2;

/**
 * The CSS `height` (in px) that shows `rows` lines of a textarea with this
 * computed style: lines times the line height, plus the padding and border
 * when `box-sizing` is `border-box`.
 */
export const rowsHeight = (style: Measured, rows: number): number => {
  const fontSize = Number.parseFloat(style.fontSize) || 16;
  const parsed = Number.parseFloat(style.lineHeight);
  const line = Number.isFinite(parsed) ? parsed : fontSize * NORMAL_LINE_HEIGHT;
  const chrome =
    style.boxSizing === 'border-box'
      ? (Number.parseFloat(style.paddingTop) || 0) +
        (Number.parseFloat(style.paddingBottom) || 0) +
        (Number.parseFloat(style.borderTopWidth) || 0) +
        (Number.parseFloat(style.borderBottomWidth) || 0)
      : 0;
  return line * rows + chrome;
};
