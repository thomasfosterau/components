<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import NumberField from '../../../src/lib/fields/NumberField.svelte';

  interface Props {
    value?: number | undefined;
    min?: number | undefined;
    max?: number | undefined;
    step?: number | undefined;
    locales?: string | undefined;
    formatOptions?: Intl.NumberFormatOptions | undefined;
    onCommit?: ((value: number | undefined) => void) | undefined;
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let {
    value = $bindable(),
    min,
    max,
    step,
    locales,
    formatOptions,
    onCommit,
    onSubmitted,
  }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Bed width" hint="In metres.">
    {#snippet children(control)}
      <NumberField
        {...control}
        name="width"
        {min}
        {max}
        {step}
        {locales}
        {formatOptions}
        {onCommit}
        bind:value
      />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{value === undefined ? 'undefined' : String(value)}</p>
