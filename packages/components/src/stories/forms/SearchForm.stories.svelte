<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import SearchForm from '../../lib/forms/SearchForm.svelte';

  const { Story } = defineMeta({
    title: 'Forms/SearchForm',
    component: SearchForm,
    parameters: {
      docs: {
        description: {
          component:
            'The site search box: a `<search>` landmark around a GET form that works with no JavaScript. GET on purpose — a search result should be a URL people can bookmark, share and go back to. The label is visually hidden but real; a placeholder is not a name.',
        },
      },
    },
  });
</script>

<Story name="Default">
  <div class="max-w-xl">
    <SearchForm action="/search" />
  </div>
</Story>

<Story name="Named and pre-filled">
  <div class="max-w-xl">
    <SearchForm
      action="/taxa"
      name="query"
      value="rosa"
      label="Search taxa"
      submitLabel="Find"
      placeholder="Scientific or common name"
    />
  </div>
</Story>
