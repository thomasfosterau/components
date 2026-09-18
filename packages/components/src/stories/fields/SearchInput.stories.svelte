<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SearchInput from '../../lib/fields/SearchInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/SearchInput',
    component: SearchInput,
    parameters: {
      docs: {
        description: {
          component:
            'A `type="search"` field with a leading icon, a clear button while there is text and a spinner while `pending`. The wrapper is a `<div>`, not a `<label>`: a button inside a label is both mis-named and label-activated.',
        },
      },
    },
  });
</script>

<script lang="ts">
  let query = $state('rosa');
  let submitted = $state('');
</script>

<Story name="With text">
  <div class="max-w-sm">
    <SearchInput
      label="Search taxa"
      bind:value={query}
      onSubmit={(text) => (submitted = text)}
      onClear={() => (submitted = '')}
    />
    <p class="text-base-content/70 mt-3 text-sm">Last submitted: {submitted || 'nothing'}</p>
  </div>
</Story>

<Story name="Empty">
  <div class="max-w-sm">
    <SearchInput label="Search taxa" value="" placeholder="Search taxa" />
  </div>
</Story>

<Story name="Pending">
  <div class="max-w-sm">
    <SearchInput label="Search taxa" value="rosa can" pending />
  </div>
</Story>

<Story name="Sizes">
  <div class="flex max-w-sm flex-col gap-3">
    <SearchInput size="xs" label="Extra small" value="rosa" />
    <SearchInput size="sm" label="Small" value="rosa" />
    <SearchInput size="lg" label="Large" value="rosa" />
  </div>
</Story>
