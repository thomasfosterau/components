/**
 * The control props `<FormField>` hands its `children` snippet, and every
 * field primitive accepts by spread: `<TextInput {...control} bind:value />`.
 * Carrying the ids this way is what keeps `aria-describedby` and
 * `aria-invalid` on the control in step with the hint and error paragraphs
 * `FormField` renders, without either side knowing the other's markup.
 *
 * The daisyUI size tables live here for the same reason `ui/tones.ts` holds
 * the button ones: Tailwind only generates classes it can see verbatim, so a
 * `input-${size}` template string emits nothing at build time. Every field
 * component looks a complete class name up rather than building one.
 *
 * @module
 */

/** Wiring a field primitive receives from its enclosing `FormField`. */
export interface FieldControl {
  /** The control's `id`; the `FormField` label points at it. */
  readonly id: string;
  /**
   * The id of the visible `<label>`. A labelable control (`input`, `select`,
   * `textarea`, `button`, …) ignores it: `<label for>` already names it. A
   * control `<label for>` cannot reach — a `role="slider"` thumb, a
   * `role="group"` / `radiogroup` root, a segmented date group — points
   * `aria-labelledby` at it instead of taking a labelling prop of its own.
   */
  readonly labelId: string;
  /** Space-separated ids of the hint / error paragraphs; empty when neither is shown. */
  readonly describedBy: string;
  /** The field currently shows an error. */
  readonly invalid: boolean;
  readonly required: boolean;
}

/**
 * What `<Fieldset>` hands its `children` snippet: the id of its `<legend>`,
 * for a role-based control inside the group (which a legend names only
 * through the `<fieldset>`, a different node) to point `aria-labelledby` at.
 */
export interface FieldsetControl {
  /** The id of the `<legend>`. */
  readonly labelId: string;
}

/** Size steps shared by the field primitives (daisyUI has no `xl` field). */
export type FieldSize = 'xs' | 'sm' | 'md' | 'lg';

/** One entry of a `Select`, `RadioGroup` or `CheckboxGroup`. */
export interface FieldOption {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean | undefined;
}

/**
 * What an options prop accepts: full options, or bare strings for the common
 * case where the value and the label are the same word.
 */
export type FieldOptionInput = FieldOption | string;

/** Widen the bare-string shorthand into full {@link FieldOption}s. */
export function toFieldOptions(options: readonly FieldOptionInput[]): readonly FieldOption[] {
  return options.map((option) =>
    typeof option === 'string' ? { value: option, label: option } : option,
  );
}

/** Literal daisyUI class per `FieldSize` for `TextInput`; a lookup table so Tailwind's scanner sees every class. */
export const inputSize: Record<FieldSize, string> = {
  xs: 'input-xs',
  sm: 'input-sm',
  md: 'input-md',
  lg: 'input-lg',
};

/** Literal daisyUI class per `FieldSize` for `Textarea`; a lookup table so Tailwind's scanner sees every class. */
export const textareaSize: Record<FieldSize, string> = {
  xs: 'textarea-xs',
  sm: 'textarea-sm',
  md: 'textarea-md',
  lg: 'textarea-lg',
};

/** Literal daisyUI class per `FieldSize` for `Select`; a lookup table so Tailwind's scanner sees every class. */
export const selectSize: Record<FieldSize, string> = {
  xs: 'select-xs',
  sm: 'select-sm',
  md: 'select-md',
  lg: 'select-lg',
};

/** Literal daisyUI class per `FieldSize` for `Checkbox`; a lookup table so Tailwind's scanner sees every class. */
export const checkboxSize: Record<FieldSize, string> = {
  xs: 'checkbox-xs',
  sm: 'checkbox-sm',
  md: 'checkbox-md',
  lg: 'checkbox-lg',
};

/** Literal daisyUI class per `FieldSize` for `Toggle`; a lookup table so Tailwind's scanner sees every class. */
export const toggleSize: Record<FieldSize, string> = {
  xs: 'toggle-xs',
  sm: 'toggle-sm',
  md: 'toggle-md',
  lg: 'toggle-lg',
};

/** Literal daisyUI class per `FieldSize` for `FileInput`; a lookup table so Tailwind's scanner sees every class. */
export const fileInputSize: Record<FieldSize, string> = {
  xs: 'file-input-xs',
  sm: 'file-input-sm',
  md: 'file-input-md',
  lg: 'file-input-lg',
};

/**
 * Literal daisyUI class per `FieldSize` for `Slider`; a lookup table so Tailwind's scanner sees every class.
 * Each sets `--range-thumb-size`, which the slider's thumb and track are sized from.
 */
export const rangeSize: Record<FieldSize, string> = {
  xs: 'range-xs',
  sm: 'range-sm',
  md: 'range-md',
  lg: 'range-lg',
};

/** Literal cell size and text-size classes per `FieldSize` for `PinInput`'s cells; a lookup table so Tailwind's scanner sees every class. */
export const pinCellSize: Record<FieldSize, string> = {
  xs: 'size-6 text-xs',
  sm: 'size-8 text-sm',
  md: 'size-10 text-base',
  lg: 'size-12 text-lg',
};

/** Literal daisyUI button size per `FieldSize` for a button inside an `input` composite (`NumberField`'s − / +, `PasswordInput`'s reveal toggle), one step smaller than the field so it fits; a lookup table so Tailwind's scanner sees every class. */
export const inputButtonSize: Record<FieldSize, string> = {
  xs: 'btn-xs',
  sm: 'btn-xs',
  md: 'btn-sm',
  lg: 'btn-md',
};
