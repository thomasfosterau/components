<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Pagination from '../../lib/data/Pagination.svelte';
  import { pageHref } from '../../lib/data/pagination.ts';

  const { Story } = defineMeta({
    title: 'Data/Pagination',
    component: Pagination,
    parameters: {
      docs: {
        description: {
          component:
            'One component for every pager the apps had grown. `variant` chooses how much is drawn; `href` versus `onPage` chooses whether the controls are links or buttons. An unavailable arm is an `aria-disabled` span, never a dead link and never removed — a Previous that vanishes on page one slides Next under the reader’s cursor.',
        },
      },
    },
  });
</script>

<script lang="ts">
  // The link form keeps the page's own query string, which is what stops a
  // filtered list losing its filter on page two.
  const href = (offset: number): string =>
    pageHref('/contests?q=alb', { offset, limit: 20 });

  let offset = $state(40);
</script>

<Story name="Window">
  <Pagination {offset} limit={20} total={151} {href} showRange locales="en-AU" />
</Story>

<Story name="First page">
  <Pagination offset={0} limit={20} total={151} {href} showRange locales="en-AU" />
</Story>

<Story name="Last page">
  <Pagination offset={140} limit={20} total={151} {href} showRange locales="en-AU" />
</Story>

<Story name="Wider window">
  <Pagination offset={200} limit={20} total={1000} {href} siblings={3} />
</Story>

<Story name="Previous / next only">
  <Pagination
    offset={40}
    limit={20}
    total={151}
    {href}
    variant="prevNext"
    statusLabel={(page, pages) => `Page ${page} of ${pages}`}
  />
</Story>

<Story name="Callback, not links">
  <!-- No `href`, so the controls are buttons: for a pager over state the URL
       does not carry. -->
  <div class="space-y-3">
    <Pagination
      {offset}
      limit={20}
      total={151}
      onPage={(next) => {
        offset = next;
      }}
      showRange
    />
    <p class="text-base-content/70 text-sm">Offset: {offset}</p>
  </div>
</Story>

<Story name="Single page, range only">
  <!-- Nothing to navigate, so no nav is drawn — but the count is still true. -->
  <Pagination offset={0} limit={20} total={12} {href} showRange />
</Story>

<Story name="Another language">
  <Pagination
    offset={40}
    limit={20}
    total={151}
    {href}
    label="Pages de résultats"
    previousLabel="Précédent"
    nextLabel="Suivant"
    pageLabel={(page) => `Page ${page}`}
    rangeLabel={(start, end, total) => `Résultats ${start} à ${end} sur ${total}`}
    showRange
  />
</Story>
