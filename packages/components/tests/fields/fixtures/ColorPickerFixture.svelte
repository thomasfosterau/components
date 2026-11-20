<!-- Test fixture: a ColorPicker inside a FormField and a form, with its bound value read back through an output. -->
<script lang="ts">
  import { untrack } from 'svelte';
  import ColorPicker from '../../../src/lib/fields/ColorPicker.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import type { ColorFormat } from '../../../src/lib/fields/color.ts';

  interface Props {
    value?: string | undefined;
    alpha?: boolean | undefined;
    format?: ColorFormat | undefined;
    withSwatches?: boolean | undefined;
    onCommit?: ((value: string) => void) | undefined;
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let {
    value = '#3a7d44',
    alpha = false,
    format = 'hex',
    withSwatches = true,
    onCommit,
    onSubmitted,
  }: Props = $props();

  let bound = $state(untrack(() => value));

  const swatches = [
    { value: '#3a7d44', label: 'Leaf green' },
    { value: '#ffeb3b', label: 'Sunflower' },
    { value: '#1e3a5f', label: 'Night blue' },
  ];
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Bed colour">
    {#snippet children(control)}
      <ColorPicker
        {...control}
        name="colour"
        bind:value={bound}
        {alpha}
        {format}
        {onCommit}
        swatches={withSwatches ? swatches : undefined}
      />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<output data-testid="bound">{bound}</output>
