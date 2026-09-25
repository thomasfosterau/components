<!-- A stand-in row-list widget: shows its rows, adds one, serialises itself. -->
<script lang="ts">
  interface Props {
    name: string;
    value: readonly unknown[];
    onChange: (next: unknown[]) => void;
    errors: readonly string[];
    label: string;
  }

  let { name, value, onChange, label }: Props = $props();
</script>

<fieldset>
  <legend>{label}</legend>
  <p>{value.length} rows</p>
  <button type="button" onclick={() => onChange([...value, { agentId: 'x', orderingPosition: value.length }])}>
    Add row
  </button>
  <input type="hidden" {name} value={JSON.stringify(value)} />
</fieldset>
