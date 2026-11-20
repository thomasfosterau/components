/**
 * Moving the sequential focus starting point to an in-page target, shared by
 * `SkipLink`, `BackToTop` and `DialogHost`.
 *
 * Some browsers scroll to a fragment without moving the focus starting point,
 * so the next Tab would continue from where the link was. The GOV.UK technique
 * fixes that: a target that is not focusable already gets `tabindex="-1"` and
 * is focused, with its outline suppressed, and both are removed again when it
 * loses focus, so the next Tab continues from inside the target.
 *
 * @module
 */

/** Options for {@link focusTarget}. */
export interface FocusTargetOptions {
  /** Focus without scrolling the target into view, for a caller that scrolls itself. */
  readonly preventScroll?: boolean | undefined;
}

/**
 * Focus `element`, making it focusable for that one visit if it is not
 * already.
 */
export const focusElement = (element: HTMLElement, options: FocusTargetOptions = {}): void => {
  if (!element.hasAttribute('tabindex')) {
    element.setAttribute('tabindex', '-1');
    element.style.outline = 'none';
    element.addEventListener(
      'blur',
      () => {
        element.removeAttribute('tabindex');
        element.style.removeProperty('outline');
      },
      { once: true },
    );
  }
  element.focus({ preventScroll: options.preventScroll === true });
};

/**
 * Focus the element with id `targetId`, making it focusable for that one
 * visit if it is not already. Returns whether the element exists.
 */
export const focusTarget = (targetId: string, options: FocusTargetOptions = {}): boolean => {
  const element = document.getElementById(targetId);
  if (element === null) return false;
  focusElement(element, options);
  return true;
};
