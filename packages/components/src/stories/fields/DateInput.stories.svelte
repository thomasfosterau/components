<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DateInput from '../../lib/fields/DateInput.svelte';
  import FormField from '../../lib/fields/FormField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/DateInput',
    component: DateInput,
    parameters: {
      docs: {
        description: {
          component:
            '`<input type="date">` in daisyUI `input` styling. `value` is the ISO calendar date (`YYYY-MM-DD`) the control speaks natively, which is also the shape an API’s date fields take, so nothing converts between the two.',
        },
      },
    },
  });
</script>

<Story name="Default">
  <div class="max-w-xs">
    <FormField label="Sown on">
      {#snippet children(control)}
        <DateInput {...control} value="2026-09-14" />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Bounded">
  <div class="max-w-xs">
    <FormField label="Observed on" hint="Between the first record and today.">
      {#snippet children(control)}
        <DateInput {...control} value="2026-03-02" min="2020-01-01" max="2026-09-17" />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Invalid">
  <div class="max-w-xs">
    <FormField label="Sown on" errors={['That is in the future.']}>
      {#snippet children(control)}
        <DateInput {...control} value="2030-01-01" />
      {/snippet}
    </FormField>
  </div>
</Story>
