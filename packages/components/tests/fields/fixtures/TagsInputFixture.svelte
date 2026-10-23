<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import TagsInput from '../../../src/lib/fields/TagsInput.svelte';

  interface Props {
    values?: string[] | undefined;
    max?: number | undefined;
    suggestions?: readonly string[] | undefined;
    onSearch?: ((query: string, signal: AbortSignal) => Promise<readonly string[]>) | undefined;
    errors?: readonly string[] | undefined;
    required?: boolean | undefined;
    /** Called when the wrapping form submits, with what it would post. */
    onSubmitted?: ((data: FormData) => void) | undefined;
  }

  let {
    values = $bindable([]),
    max,
    suggestions,
    onSearch,
    errors,
    required,
    onSubmitted,
  }: Props = $props();
</script>

<form
  onsubmit={(event) => {
    event.preventDefault();
    onSubmitted?.(new FormData(event.currentTarget));
  }}
>
  <FormField label="Tags" hint="Press Enter or comma after each." {errors} {required}>
    {#snippet children(control)}
      <TagsInput {...control} name="tags" {max} {suggestions} {onSearch} debounceMs={0} bind:values />
    {/snippet}
  </FormField>
  <button type="submit">Save</button>
</form>
<p data-testid="bound">{values.join('|')}</p>
