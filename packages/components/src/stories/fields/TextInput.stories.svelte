<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import TextInput from '../../lib/fields/TextInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/TextInput',
    component: TextInput,
    parameters: {
      docs: {
        description: {
          component:
            'A native `<input>` in daisyUI `input` styling. Every native attribute passes through; the component adds only `aria-describedby` and `aria-invalid` from the `FieldControl` its `FormField` hands it.',
        },
      },
    },
  });
</script>

<Story name="Sizes">
  <div class="flex max-w-sm flex-col gap-3">
    <TextInput size="xs" value="Extra small" aria-label="Extra small" />
    <TextInput size="sm" value="Small" aria-label="Small" />
    <TextInput size="md" value="Medium — the default" aria-label="Medium" />
    <TextInput size="lg" value="Large" aria-label="Large" />
  </div>
</Story>

<Story name="Types">
  <div class="flex max-w-sm flex-col gap-3">
    <FormField label="Email">
      {#snippet children(control)}
        <TextInput {...control} type="email" value="ada@example.org" />
      {/snippet}
    </FormField>
    <FormField label="Homepage">
      {#snippet children(control)}
        <TextInput {...control} type="url" value="https://example.org" />
      {/snippet}
    </FormField>
    <FormField label="Plants counted">
      {#snippet children(control)}
        <TextInput {...control} type="number" value="42" min={0} />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Invalid">
  <div class="max-w-sm">
    <FormField label="Scientific name" errors={['That name is already recorded.']}>
      {#snippet children(control)}
        <TextInput {...control} value="Rosa canina" />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Disabled">
  <div class="max-w-sm">
    <TextInput value="Rosa canina" disabled aria-label="Scientific name" />
  </div>
</Story>
