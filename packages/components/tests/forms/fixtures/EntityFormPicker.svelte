<!-- A stand-in FK picker speaking the widget bridge contract. -->
<script lang="ts">
  interface Props {
    name: string;
    value: string;
    onChange: (next: string) => void;
    errors: readonly string[];
    label: string;
    options: readonly string[];
    hint?: string | undefined;
  }

  let { name, value, onChange, errors, label, options, hint }: Props = $props();
</script>

<label>
  {label}
  <select {name} {value} onchange={(event) => onChange(event.currentTarget.value)}>
    <option value="">None</option>
    {#each options as option (option)}
      <option value={option}>{option}</option>
    {/each}
  </select>
</label>
{#if hint !== undefined}<p>{hint}</p>{/if}
{#each errors as error (error)}<p>{error}</p>{/each}
