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
  /** Space-separated ids of the hint / error paragraphs; empty when neither is shown. */
  readonly describedBy: string;
  /** The field currently shows an error. */
  readonly invalid: boolean;
  readonly required: boolean;
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
