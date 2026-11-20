<script lang="ts">
  import ContextualHelp from '../../../src/lib/fields/ContextualHelp.svelte';
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import TextInput from '../../../src/lib/fields/TextInput.svelte';
</script>

<FormField label="Zone">
  {#snippet help()}
    <ContextualHelp title="Hardiness zone">The coldest winter your plants survive.</ContextualHelp>
  {/snippet}
  {#snippet children(control)}
    <TextInput {...control} />
  {/snippet}
</FormField>
