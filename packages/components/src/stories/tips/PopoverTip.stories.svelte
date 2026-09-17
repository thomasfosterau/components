<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PopoverTip from '../../lib/tips/PopoverTip.svelte';
  import { createTipStack } from '../../lib/tips/tip-stack.ts';
  import { createTipStore, memoryTipStorage } from '../../lib/tips/tip-store.svelte.ts';
  import type { TipConfig } from '../../lib/tips/types.ts';

  // Storage that forgets when the page does: a tip dismissed while reviewing
  // one story must not be invisible in the next reviewer's session.
  const storyStore = (...configs: readonly TipConfig[]) => {
    const store = createTipStore({ storage: memoryTipStorage() });
    for (const config of configs) store.register(config);
    return store;
  };

  const search: TipConfig = {
    id: 'story-search',
    title: 'Search across everything',
    message: 'Titles, tags and notes, in one box.',
  };
  const filters: TipConfig = {
    id: 'story-filters',
    title: 'Narrow it down',
    message: 'Filter a list without losing your place.',
  };

  const { Story } = defineMeta({
    title: 'Tips/PopoverTip',
    component: PopoverTip,
    tags: ['autodocs'],
  });
</script>

<Story name="Above its trigger">
  <div class="flex justify-center py-24">
    <PopoverTip config={search} store={storyStore(search)} placement="top">
      <button type="button" class="btn btn-primary">Search</button>
    </PopoverTip>
  </div>
</Story>

<Story name="Beside its trigger">
  <div class="flex justify-center py-24">
    <PopoverTip config={filters} store={storyStore(filters)} placement="right">
      <button type="button" class="btn">Filters</button>
    </PopoverTip>
  </div>
</Story>

<!-- Two tips, one stack: Escape closes the one that appeared last, not both. -->
<Story name="Two tips sharing a stack">
  {@const store = storyStore(search, filters)}
  {@const stack = createTipStack()}
  <div class="flex justify-around py-24">
    <PopoverTip config={search} {store} {stack} placement="bottom">
      <button type="button" class="btn btn-primary">Search</button>
    </PopoverTip>
    <PopoverTip config={filters} {store} {stack} placement="bottom">
      <button type="button" class="btn">Filters</button>
    </PopoverTip>
  </div>
</Story>
