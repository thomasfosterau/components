<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
  import TextInput from '../../../src/lib/fields/TextInput.svelte';

  interface Props {
    id?: string | undefined;
    label: string;
    hint?: string | undefined;
    errors?: readonly string[] | undefined;
    required?: boolean | undefined;
    requiredLabel?: string | undefined;
  }

  let { id, label, hint, errors, required, requiredLabel }: Props = $props();
</script>

<FormField {id} {label} {hint} {errors} {required} {requiredLabel}>
  {#snippet children(control)}
    <TextInput {...control} value="Rosa canina" />
  {/snippet}
</FormField>
