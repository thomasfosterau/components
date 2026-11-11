<!-- @component
Several checkboxes answering one question, inside one `Fieldset`.
-->
<!--
  CheckboxGroup — several checkboxes answering one question, inside one
  `Fieldset`.

  ARIA contract: the `<legend>` names the group and is repeated as focus moves
  between the boxes; each box is named by its own inline label; the group's
  hint and errors are on the `<fieldset>`, so they are read once for the group
  rather than once per box.

  `values` is the list of TICKED values, bindable. It is a plain array rather
  than a `Set` because that is what a form's decoded body and a JSON payload
  both look like, and because Svelte's deep reactivity tracks it.

  `selectAll` adds a parent checkbox (the APG mixed-state pattern) above the
  options, indented under it: ticked when every enabled option is, mixed
  when some are, clear when none are. Activating it while mixed or clear
  ticks every enabled option; while ticked, clears them. A disabled option is
  never changed. It is named by `selectAllLabel`, described by the legend
  like the rest of the group, points `aria-controls` at the options, and has
  no `name`, so it is never submitted.
-->
<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import Checkbox from './Checkbox.svelte';
  import Fieldset from './Fieldset.svelte';
  import { toFieldOptions, type FieldOptionInput, type FieldSize } from './field-types.ts';

  interface Props extends Omit<HTMLAttributes<HTMLFieldSetElement>, 'children'> {
    /** The question the boxes answer. */
    legend: string;
    /** Full options, or bare strings when value and label are the same. */
    options: readonly FieldOptionInput[];
    /**
     * The ticked values.
     * @defaultValue `[]`
     */
    values?: string[] | undefined;
    /** Posted field name; every box shares it, as a multi-value field. */
    name?: string | undefined;
    /** Guidance rendered under the legend. */
    hint?: string | undefined;
    /**
     * Validation messages; any at all marks the group invalid.
     * @defaultValue `[]`
     */
    errors?: readonly string[] | undefined;
    /** Marks the group required and reads `requiredLabel` after the legend. */
    required?: boolean | undefined;
    /**
     * Read out after the legend when `required`.
     * @defaultValue `'(required)'`
     */
    requiredLabel?: string | undefined;
    /** Disables every option. */
    disabled?: boolean | undefined;
    /**
     * daisyUI size step.
     * @defaultValue `'md'`
     */
    size?: FieldSize | undefined;
    /** Render a parent checkbox above the options that ticks or clears them all. */
    selectAll?: boolean | undefined;
    /**
     * The parent checkbox's text.
     * @defaultValue `'Select all'`
     */
    selectAllLabel?: string | undefined;
  }

  let {
    legend,
    options,
    values = $bindable([]),
    name,
    hint,
    errors = [],
    required = false,
    requiredLabel = '(required)',
    disabled = false,
    size = 'md',
    selectAll = false,
    selectAllLabel = 'Select all',
    ...rest
  }: Props = $props();

  const uid = $props.id();
  const optionId = (index: number): string => `${uid}-option-${index}`;

  const entries = $derived(toFieldOptions(options));
  const invalid = $derived(errors.length > 0);

  const toggle = (value: string, ticked: boolean): void => {
    values = ticked ? [...values, value] : values.filter((entry) => entry !== value);
  };

  /** The options the parent can change: a disabled one is never touched. */
  const changeable = $derived(
    disabled ? [] : entries.filter((option) => option.disabled !== true),
  );
  const tickedCount = $derived(changeable.filter((option) => values.includes(option.value)).length);
  const allTicked = $derived(changeable.length > 0 && tickedCount === changeable.length);
  const someTicked = $derived(tickedCount > 0 && !allTicked);

  /** Mixed or none → tick every changeable option; all → clear them. */
  const toggleAll = (): void => {
    const own = new Set(changeable.map((option) => option.value));
    const kept = values.filter((value) => !own.has(value));
    values = allTicked ? kept : [...kept, ...changeable.map((option) => option.value)];
  };
</script>

{#snippet boxes()}
  {#each entries as option, index (option.value)}
    <Checkbox
      id={optionId(index)}
      label={option.label}
      {name}
      {size}
      {invalid}
      value={option.value}
      disabled={disabled || option.disabled === true}
      checked={values.includes(option.value)}
      onchange={(event) => toggle(option.value, event.currentTarget.checked)}
    />
  {/each}
{/snippet}

<Fieldset {...rest} {legend} {hint} {errors} {required} {requiredLabel}>
  {#if selectAll}
    <Checkbox
      label={selectAllLabel}
      {size}
      disabled={disabled || changeable.length === 0}
      checked={allTicked}
      indeterminate={someTicked}
      aria-controls={entries.map((_, index) => optionId(index)).join(' ')}
      onchange={toggleAll}
    />
    <div class="ms-6 flex flex-col">{@render boxes()}</div>
  {:else}
    {@render boxes()}
  {/if}
</Fieldset>
