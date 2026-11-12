<!-- Storybook only: submit with the name empty and the summary appears and takes focus; typing then fixes it without moving focus. -->
<script lang="ts">
  import FormField from '../../lib/fields/FormField.svelte';
  import TextInput from '../../lib/fields/TextInput.svelte';
  import ErrorSummary from '../../lib/forms/ErrorSummary.svelte';
  import Button from '../../lib/ui/Button.svelte';

  let name = $state('');
  let attempts = $state(0);
  const errors = $derived(attempts > 0 && name === '' ? ['Enter a bed name'] : []);
</script>

<form
  class="space-y-4"
  novalidate
  onsubmit={(event) => {
    event.preventDefault();
    attempts += 1;
  }}
>
  <ErrorSummary
    titlePrefix=""
    errors={errors.map((message) => ({ fieldId: 'client-bed-name', message }))}
    focusKey={attempts === 0 ? undefined : attempts}
  />
  <FormField id="client-bed-name" label="Bed name" {errors}>
    {#snippet children(control)}<TextInput {...control} name="name" bind:value={name} />{/snippet}
  </FormField>
  <Button type="submit">Save bed</Button>
</form>
