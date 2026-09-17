<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PaginationFooter from '../../lib/data/PaginationFooter.svelte';
  import { pageHref } from '../../lib/data/pagination.ts';

  const { Story } = defineMeta({
    title: 'Data/PaginationFooter',
    component: PaginationFooter,
    parameters: {
      docs: {
        description: {
          component:
            'The count and the pager from ONE set of numbers. Rendering the two separately at each call site means threading the limit, the offset and the total through twice — which is how they come to disagree about which request they came from.',
        },
      },
    },
  });
</script>

<script lang="ts">
  const href = (offset: number): string => pageHref('/plants?q=rosa', { offset, limit: 20 });
</script>

<Story name="Footer">
  <PaginationFooter shown={20} offset={40} limit={20} total={151} {href} locales="en-AU" />
</Story>

<Story name="Previous / next only">
  <PaginationFooter
    shown={20}
    offset={40}
    limit={20}
    total={151}
    {href}
    variant="prevNext"
    locales="en-AU"
  />
</Story>

<Story name="One page">
  <!-- Nothing to page, so only the count is drawn. -->
  <PaginationFooter shown={12} offset={0} limit={20} total={12} {href} />
</Story>

<Story name="Nothing found">
  <!-- Both halves render nothing; the page's own empty state speaks instead. -->
  <div class="border-base-300 border border-dashed p-4">
    <PaginationFooter shown={0} offset={0} limit={20} total={0} {href} />
    <p class="text-base-content/50 text-sm italic">(the dashed box is empty)</p>
  </div>
</Story>
