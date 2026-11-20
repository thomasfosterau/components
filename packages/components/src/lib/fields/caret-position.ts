/**
 * Where a caret position in a textarea or input sits on screen, measured
 * with a hidden mirror that copies the field's text metrics.
 *
 * @module
 */

const COPIED = [
  'boxSizing',
  'width',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'direction',
] as const;

/** A caret's top-left and line height, in px from the field's border box, scroll included. */
export interface CaretPosition {
  readonly top: number;
  readonly left: number;
  readonly height: number;
}

/** Measure the caret at `position` in `field`. */
export function caretPosition(
  field: HTMLTextAreaElement | HTMLInputElement,
  position: number,
): CaretPosition {
  const style = getComputedStyle(field);
  const mirror = document.createElement('div');
  for (const property of COPIED) mirror.style[property] = style[property];
  const multiline = field instanceof HTMLTextAreaElement;
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';
  mirror.style.whiteSpace = multiline ? 'pre-wrap' : 'pre';
  mirror.style.overflowWrap = multiline ? 'break-word' : 'normal';
  mirror.textContent = field.value.slice(0, position);
  const marker = document.createElement('span');
  marker.textContent = field.value.slice(position) || '.';
  mirror.append(marker);
  document.body.append(mirror);
  const height = Number.parseFloat(style.lineHeight) || marker.offsetHeight;
  const result = {
    top: marker.offsetTop - field.scrollTop,
    left: marker.offsetLeft - field.scrollLeft,
    height,
  };
  mirror.remove();
  return result;
}
