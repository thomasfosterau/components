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
-->
<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { checkboxSize, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked' | 'size'> {
    /** Text beside the box; becomes the input's accessible name. */
    label: string;
    checked?: boolean;
    size?: FieldSize | undefined;
    invalid?: boolean | undefined;
    describedBy?: string | undefined;
  }

  let {
    label,
    checked = $bindable(false),
    size = 'md',
    invalid = false,
    describedBy = '',
    class: className,
    ...rest
  }: Props = $props();
</script>

<label class={['label cursor-pointer justify-start gap-3', className]}>
  <input
    {...rest}
    type="checkbox"
    bind:checked
    aria-invalid={invalid ? 'true' : undefined}
    aria-describedby={describedBy === '' ? undefined : describedBy}
    class={['checkbox', checkboxSize[size], invalid && 'checkbox-error']}
  />
  <span>{label}</span>
</label>
