<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ResultCount from '../../lib/data/ResultCount.svelte';

  const { Story } = defineMeta({
    title: 'Data/ResultCount',
    component: ResultCount,
    parameters: {
      docs: {
        description: {
          component:
            'Every list an API serves is a `LIMIT`ed window, so a page showing only the window would quietly imply it was everything. `PaginationFooter` is this plus the pager, from one set of numbers.',
        },
      },
    },
  });
</script>

<Story name="Count">
  <ResultCount shown={24} total={4310} locales="en-AU" />
</Story>

<Story name="The caller’s own sentence">
  <ResultCount shown={24} total={310} label={(shown, total) => `${shown} of ${total} plants`} />
</Story>

<Story name="Nothing to qualify">
  <!-- Renders nothing: "Showing 0 of 0" beside an empty state is noise. -->
  <div class="border-base-300 border border-dashed p-4">
    <ResultCount shown={0} total={0} />
    <p class="text-base-content/50 text-sm italic">(the dashed box is empty)</p>
  </div>
</Story>
