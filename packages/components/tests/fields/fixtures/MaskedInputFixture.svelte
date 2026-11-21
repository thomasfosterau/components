<!-- A MaskedInput inside a FormField and a form, with both values bound. -->
<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import type { Mask, MaskPreset } from '../../../src/lib/fields/mask.ts';
  import MaskedInput from '../../../src/lib/fields/MaskedInput.svelte';

  interface Props {
    mask?: Mask | MaskPreset | undefined;
    value?: string | undefined;
    formatOn?: 'input' | 'blur' | undefined;
    submitFormatted?: boolean | undefined;
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let {
    mask = '9999 999 999',
    value = $bindable(''),
    formatOn,
    submitFormatted,
    onSubmitted,
  }: Props = $props();
  let formatted = $state('');
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Mobile" hint="For example, 0412 345 678">
    {#snippet children(control)}
      <MaskedInput
        {...control}
        {mask}
        {formatOn}
        {submitFormatted}
        name="mobile"
        bind:value
        bind:formatted
      />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="raw">{value}</p>
<p data-testid="formatted">{formatted}</p>
