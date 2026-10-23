<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import Slider from '../../../src/lib/fields/Slider.svelte';

  interface Props {
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
    errors?: readonly string[] | undefined;
    range?: boolean | undefined;
  }

  let { onSubmitted, errors, range = false }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Hours of sun" hint="Full sun is six hours or more." {errors}>
    {#snippet children(control)}
      {#if range}
        <Slider {...control} type="multiple" name="sun" min={0} max={12} value={[2, 6]} />
      {:else}
        <Slider {...control} name="sun" min={0} max={12} value={4} />
      {/if}
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
