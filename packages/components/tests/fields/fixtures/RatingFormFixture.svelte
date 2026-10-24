<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import Rating from '../../../src/lib/fields/Rating.svelte';

  interface Props {
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
    errors?: readonly string[] | undefined;
    value?: number | undefined;
    disabled?: boolean | undefined;
  }

  let { onSubmitted, errors, value = $bindable(3), disabled = false }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="How well did it grow?" hint="Five is a bumper crop." {errors}>
    {#snippet children(control)}
      <Rating {...control} name="score" bind:value {disabled} />
    {/snippet}
  </FormField>
  <p>Bound: {value}</p>
  <button type="submit">Save</button>
</form>
