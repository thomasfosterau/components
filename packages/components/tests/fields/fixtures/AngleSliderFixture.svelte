<!-- An AngleSlider inside a FormField and a form, with the value bound. -->
<script lang="ts">
  import AngleSlider from '../../../src/lib/fields/AngleSlider.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';

  interface Props {
    value?: number | undefined;
    min?: number | undefined;
    max?: number | undefined;
    step?: number | undefined;
    zero?: 'north' | 'east' | undefined;
    compass?: boolean | undefined;
    marks?: readonly { value: number; label?: string | undefined }[] | undefined;
    restrictToMarks?: boolean | undefined;
    wrap?: boolean | undefined;
    onCommit?: ((value: number) => void) | undefined;
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let { value = $bindable(0), onSubmitted, ...props }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Aspect" hint="Which way the bed faces.">
    {#snippet children(control)}
      <AngleSlider {...control} {...props} name="aspect" data-testid="dial" bind:value />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{value}</p>
