<!-- @component
A daisyUI `checkbox` with its label in the same `<label>`, so the whole row is the hit target.
-->
<!--
  Checkbox — daisyUI `checkbox` with its label in the same `<label>`, so the
  whole row is the hit target and the input is named without an `id`/`for`
  pair at all.

  Unlike the text fields this one carries its OWN label: a checkbox's label
  sits beside it rather than above it, and a `FormField` wrapped around a
  single checkbox would put the question in two places. Use `CheckboxGroup`
  (or `Fieldset`) when several checkboxes answer one question.

  ARIA contract: a native `<input type="checkbox">` wrapped in its `<label>`,
  so `checked` is the state assistive technology reads and Space toggles it
  with no script. `describedBy` and `invalid` tie it to an enclosing group's
  hint and errors when there is one.

  Mixed state: `indeterminate` binds the input's `indeterminate` PROPERTY
  (there is no attribute), which the platform exposes as "mixed" and daisyUI
  draws as a dash, so it is never colour alone. No `aria-checked` — it is
  invalid on a native checkbox.
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { checkboxSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked' | 'size'> {
    /** Text beside the box; becomes the input's accessible name. */
    label: string;
    /** Whether the box is ticked. Bindable. */
    checked?: boolean | undefined;
    /**
     * Show the mixed state ("some of these"). A click clears it and ticks the
     * box, as the platform does. Bindable.
     * @defaultValue `false`
     */
    indeterminate?: boolean | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** `FieldControl`: the field is in error — sets `aria-invalid` and the error style. */
    invalid?: boolean | undefined;
    /**
     * `FieldControl`: space-separated ids for `aria-describedby`.
     * @defaultValue `''`
     */
    describedBy?: string | undefined;
    /**
     * `FieldControl`: the visible label's id. Not used — this control is
     * labelable, so the `FormField`'s `<label for>` already names it; taken
     * here so a spread `FieldControl` does not leak it as an attribute.
     */
    labelId?: string | undefined;
  }

  let {
    label,
    checked = $bindable(false),
    indeterminate = $bindable(false),
    size = 'md',
    invalid = false,
    describedBy = '',
    labelId: _labelId,
    class: className,
    ...rest
  }: Props = $props();
</script>

<label class={['label cursor-pointer justify-start gap-3', className]}>
  <input
    {...rest}
    type="checkbox"
    bind:checked
    bind:indeterminate
    aria-invalid={invalid ? 'true' : undefined}
    aria-describedby={describedBy === '' ? undefined : describedBy}
    class={['checkbox', checkboxSize[size], invalid && 'checkbox-error']}
  />
  <span>{label}</span>
</label>
