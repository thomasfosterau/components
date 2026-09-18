<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FilterBar from '../../lib/layout/FilterBar.svelte';

  const { Story } = defineMeta({
    title: 'Layout/FilterBar',
    component: FilterBar,
    parameters: {
      docs: {
        description: {
          component:
            'The row of filter options above a list, as links rather than a form — so a filtered view is a URL an operator can bookmark, paste or reload. `href` and `active` are the page’s to supply, because only the page knows what the rest of its query string is. The active option carries `aria-current="page"` as well as the highlight.',
        },
      },
    },
  });

  const status = [
    { key: 'all', label: 'All', href: '/datasets', active: true },
    { key: 'published', label: 'Published', href: '/datasets?status=published', active: false },
    { key: 'draft', label: 'Draft', href: '/datasets?status=draft', active: false },
    { key: 'archived', label: 'Archived', href: '/datasets?status=archived', active: false },
  ];
</script>

<Story name="Filter by status">
  <FilterBar options={status} label="Filter by status" />
</Story>

<Story name="Two rows, two axes">
  <div class="space-y-2">
    <FilterBar options={status} label="Filter by status" />
    <FilterBar
      label="Filter by licence"
      options={[
        { key: 'any', label: 'Any licence', href: '/datasets', active: false },
        { key: 'ccby', label: 'CC BY 4.0', href: '/datasets?licence=cc-by', active: true },
        { key: 'cc0', label: 'CC0', href: '/datasets?licence=cc0', active: false },
      ]}
    />
  </div>
</Story>
