/**
 * The control props `<FormField>` hands its `children` snippet, and every
 * field primitive accepts by spread: `<TextInput {...control} bind:value />`.
 * Carrying the ids this way is what keeps `aria-describedby` and
 * `aria-invalid` on the control in step with the hint and error paragraphs
 * `FormField` renders, without either side knowing the other's markup.
 *
 * @module
 */

/** Wiring a field primitive receives from its enclosing `FormField`. */
export interface FieldControl {
  /** The control's `id`; the `FormField` label points at it. */
  readonly id: string;
  /** Space-separated ids of the hint / error paragraphs; empty when neither is shown. */
  readonly describedBy: string;
  /** The field currently shows an error. */
  readonly invalid: boolean;
  readonly required: boolean;
}

/** Size steps shared by the field primitives (daisyUI has no `xl` field). */
export type FieldSize = 'xs' | 'sm' | 'md' | 'lg';
