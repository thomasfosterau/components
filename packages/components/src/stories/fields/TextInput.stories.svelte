<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import TextInput from '../../lib/fields/TextInput.svelte';
  import { AtSign, Search } from '@lucide/svelte';

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

<Story name="Prefix and suffix">
  <div class="flex max-w-sm flex-col gap-3">
    <FormField label="Website">
      {#snippet children(control)}
        <TextInput {...control} prefix="https://" suffix=".example.org" value="garden" />
      {/snippet}
    </FormField>
    <FormField label="Price">
      {#snippet children(control)}
        <TextInput {...control} type="number" prefix="$" value="12.50" />
      {/snippet}
    </FormField>
    <FormField label="Harvest weight">
      {#snippet children(control)}
        <TextInput {...control} type="number" suffix="kg" value="3.2" />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Leading and trailing icons">
  <div class="flex max-w-sm flex-col gap-3">
    <FormField label="Handle">
      {#snippet children(control)}
        <TextInput {...control} value="thomas">
          {#snippet leading()}<AtSign class="size-4 opacity-60" aria-hidden="true" />{/snippet}
        </TextInput>
      {/snippet}
    </FormField>
    <FormField label="Find a plant">
      {#snippet children(control)}
        <TextInput {...control} type="search">
          {#snippet trailing()}<Search class="size-4 opacity-60" aria-hidden="true" />{/snippet}
        </TextInput>
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Character counter">
  <div class="max-w-sm">
    <FormField label="Bed name" hint="Shown on the garden map.">
      {#snippet children(control)}
        <TextInput {...control} maxlength={20} showCount value="Bed 4 — tomatoes" />
      {/snippet}
    </FormField>
  </div>
</Story>
