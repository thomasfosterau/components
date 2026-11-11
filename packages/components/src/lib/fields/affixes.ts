/**
 * Internal helpers shared by `TextInput` and `Textarea`'s decorations and
 * character counter. Not exported from any barrel.
 *
 * @module
 */

import type { Attachment } from 'svelte/attachments';

/** "12 / 20". */
export const defaultCountLabel = (length: number, max: number): string => `${length} / ${max}`;

/** "2 characters left". */
export const defaultRemainingLabel = (left: number): string => `${left} characters left`;

/** Announcements start at 10 characters left, or a tenth of the limit if that is more. */
export const defaultWarnAt = (max: number): number => Math.max(10, Math.round(max * 0.1));

/**
 * An attachment for a prefix or suffix: a pointer press on the text focuses
 * the field instead of selecting the text, as a `<label>` would, without
 * the label's text joining the field's accessible name.
 */
export const focusInputOnPress =
  (target: () => HTMLElement | undefined): Attachment<HTMLElement> =>
  (node) => {
    const listening = new AbortController();
    node.addEventListener(
      'pointerdown',
      (event) => {
        const field = target();
        if (field === undefined) return;
        event.preventDefault();
        field.focus();
      },
      { signal: listening.signal },
    );
    return () => listening.abort();
  };
