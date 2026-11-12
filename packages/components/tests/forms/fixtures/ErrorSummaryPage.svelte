<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import Fieldset from '../../../src/lib/fields/Fieldset.svelte';
  import Checkbox from '../../../src/lib/fields/Checkbox.svelte';
  import TextInput from '../../../src/lib/fields/TextInput.svelte';
  import ErrorSummary from '../../../src/lib/forms/ErrorSummary.svelte';
  import type { ErrorSummaryItem } from '../../../src/lib/forms/error-summary.ts';

  interface Props {
    errors?: readonly ErrorSummaryItem[];
    formErrors?: readonly string[];
    focusKey?: number | undefined;
    titlePrefix?: string | undefined;
  }

  let { errors = [], formErrors = [], focusKey, titlePrefix }: Props = $props();

  const bed = { fieldId: 'bed-name', message: 'Enter a bed name' };
  const garden = { fieldId: 'garden', message: 'Enter a garden' };
  const tags = { fieldId: 'tags', message: 'Choose at least one tag' };
  // Seeded once from the props: the buttons below drive it afterwards.
  // svelte-ignore state_referenced_locally
  let current = $state(errors);
  // svelte-ignore state_referenced_locally
  let attempts = $state(focusKey);
  const messageFor = (id: string): readonly string[] =>
    current.filter((item) => item.fieldId === id).map((item) => item.message);
</script>

<button type="button" onclick={() => (current = [bed, garden])}>Fail two</button>
<button type="button" onclick={() => (current = [])}>Clear</button>
<button type="button" onclick={() => (current = [{ ...bed, message: 'Bed name is too short' }, garden])}>
  Reword
</button>
<button type="button" onclick={() => (current = [garden])}>Fix bed</button>
<button type="button" onclick={() => (current = [bed, garden, tags])}>Fail three</button>
<button type="button" onclick={() => (attempts = (attempts ?? 0) + 1)}>Submit again</button>

<form>
  <ErrorSummary errors={current} {formErrors} focusKey={attempts} {titlePrefix} />
  <div style="height: 120vh">Spacer</div>
  <FormField id="bed-name" label="Bed name" errors={messageFor('bed-name')}>
    {#snippet children(control)}<TextInput {...control} />{/snippet}
  </FormField>
  <FormField id="garden" label="Garden">
    {#snippet children(control)}<TextInput {...control} />{/snippet}
  </FormField>
  <Fieldset id="tags" legend="Tags">
    {#snippet children()}<Checkbox label="Shady" />{/snippet}
  </Fieldset>
  <div style="height: 120vh">Tail</div>
</form>
