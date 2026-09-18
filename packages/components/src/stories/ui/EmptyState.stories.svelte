<script module lang="ts">
  import { Sprout } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import LinkButton from '../../lib/ui/LinkButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/EmptyState',
    component: EmptyState,
    parameters: {
      docs: {
        description: {
          component:
            'The quiet card an index shows instead of a bare empty list. "Nothing here" is a normal state of a healthy page, so it is drawn on the same surface as everything else. The title is a real heading.',
        },
      },
    },
  });
</script>

<Story name="Title only">
  <EmptyState title="No gardens yet" />
</Story>

<Story name="With copy and an action">
  <EmptyState
    title="No gardens yet"
    description="A garden is a place you grow things — a balcony, a bed, a whole block. Start with one and add the plants later."
  >
    {#snippet icon()}<Sprout class="size-10" />{/snippet}
    {#snippet action()}
      <LinkButton href="/gardens/new" tone="primary">Start a garden</LinkButton>
    {/snippet}
  </EmptyState>
</Story>

<Story name="Inside a section (h3)">
  <section>
    <h2 class="mb-4 text-xl font-bold">Recent observations</h2>
    <EmptyState
      title="Nothing observed this week"
      description="Observations you record will appear here."
      headingLevel={3}
    />
  </section>
</Story>
