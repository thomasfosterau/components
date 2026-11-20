<script lang="ts">
  import ColorSwatchGroup from '../../../src/lib/fields/ColorSwatchGroup.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';

  interface Props {
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let { onSubmitted }: Props = $props();

  const swatches = [
    { value: '#3a7d44', label: 'Moss green' },
    { value: '#1e3a5f', label: 'Night blue' },
  ];
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Label colour" hint="Shown on the tag.">
    {#snippet children(control)}
      <ColorSwatchGroup {...control} name="colour" {swatches} />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
