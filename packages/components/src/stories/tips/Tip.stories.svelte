<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Tip from '../../lib/tips/Tip.svelte';
  import { createTipStore, memoryTipStorage } from '../../lib/tips/tip-store.svelte.ts';
  import type { TipConfig } from '../../lib/tips/types.ts';

  // Storage that forgets when the page does: a tip dismissed while reviewing
  // one story must not be invisible in the next reviewer's session.
  const storyStore = (config: TipConfig) => {
    const store = createTipStore({ storage: memoryTipStorage() });
    store.register(config);
    return store;
  };

  const welcome: TipConfig = {
    id: 'story-welcome',
    title: 'Welcome',
    message: 'Track what you grow, where it is, and how it is doing.',
  };

  const withActions: TipConfig = {
    id: 'story-first-project',
    title: 'Create your first project',
    message: 'A project holds everything you record against.',
    actions: [
      { id: 'create', title: 'Create a project', handler: () => {} },
      { id: 'later', title: 'Later', handler: () => {} },
    ],
  };

  /** A rule that never holds: the tip is silent rather than absent by accident. */
  const ruledOut: TipConfig = {
    id: 'story-ruled-out',
    title: 'You should not see this',
    message: 'Its rule evaluates false, so the tip never shows.',
    rules: [{ id: 'never', evaluate: () => false }],
  };

  const { Story } = defineMeta({ title: 'Tips/Tip', component: Tip, tags: ['autodocs'] });
</script>

<Story name="Title and message">
  <Tip config={welcome} store={storyStore(welcome)} />
</Story>

<Story name="With actions">
  <Tip config={withActions} store={storyStore(withActions)} />
</Story>

<Story name="Custom dismiss label">
  <Tip config={welcome} store={storyStore(welcome)} dismissLabel="Close this tip" />
</Story>

<Story name="A rule that does not hold">
  <div class="space-y-2">
    <p class="text-base-content/70 text-sm">Nothing renders below — that is the story.</p>
    <Tip config={ruledOut} store={storyStore(ruledOut)} />
  </div>
</Story>
