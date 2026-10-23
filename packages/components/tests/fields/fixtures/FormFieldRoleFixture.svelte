<!-- Controls `<label for>` cannot name: a focusable `role="slider"` and a
     roving `role="radiogroup"` whose root is not itself a tab stop. Each
     points `aria-labelledby` at the `labelId` its `FormField` hands it. -->
<script lang="ts">
  import FormField from '../../../src/lib/fields/FormField.svelte';
</script>

<FormField label="Hours of sun">
  {#snippet children(control)}
    <div
      id={control.id}
      role="slider"
      tabindex="0"
      aria-labelledby={control.labelId}
      aria-describedby={control.describedBy === '' ? undefined : control.describedBy}
      aria-valuemin={0}
      aria-valuemax={12}
      aria-valuenow={6}
    >
      6
    </div>
  {/snippet}
</FormField>

<FormField label="Watering">
  {#snippet children(control)}
    <div id={control.id} role="radiogroup" aria-labelledby={control.labelId}>
      <button type="button" role="radio" aria-checked="false" tabindex="-1">Daily</button>
      <button type="button" role="radio" aria-checked="true" tabindex="0">Weekly</button>
    </div>
  {/snippet}
</FormField>
