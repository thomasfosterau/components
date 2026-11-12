<script lang="ts">
  import FormField from '../../lib/fields/FormField.svelte';
  import TextInput from '../../lib/fields/TextInput.svelte';
  import SaveBar from '../../lib/forms/SaveBar.svelte';

  interface Props {
    position?: 'top' | 'bottom' | undefined;
  }

  let { position = 'bottom' }: Props = $props();

  const saved = 'Kitchen garden';
  let name = $state(saved);
  const dirty = $derived(name !== saved);
</script>

<form
  id="settings-demo"
  class="space-y-4"
  onsubmit={(event) => {
    event.preventDefault();
  }}
>
  <FormField id="settings-demo-name" label="Garden name">
    {#snippet children(control)}
      <TextInput {...control} name="name" bind:value={name} />
    {/snippet}
  </FormField>
</form>
<SaveBar
  {dirty}
  {position}
  form="settings-demo"
  onDiscard={() => {
    name = saved;
  }}
/>
