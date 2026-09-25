<!-- Storybook only: an FK picker speaking EntityForm's widget bridge
     (`name` / `value` / `onChange` / `errors`), built from this library's
     own `FormField` + `Select`. -->
<script lang="ts">
  import FormField from '../../lib/fields/FormField.svelte';
  import Select from '../../lib/fields/Select.svelte';

  interface Props {
    name: string;
    value: string;
    onChange: (next: string) => void;
    errors: readonly string[];
    label: string;
    options: readonly { value: string; label: string }[];
  }

  let { name, value, onChange, errors, label, options }: Props = $props();
</script>

<FormField id={`picker-${name}`} {label} {errors} required>
  {#snippet children(control)}
    <Select {...control} {name} {options} placeholder="Choose a garden" bind:value={() => value, onChange} />
  {/snippet}
</FormField>
