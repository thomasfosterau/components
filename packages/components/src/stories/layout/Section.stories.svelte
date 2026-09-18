<script module lang="ts">
  import { Sprout } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Section from '../../lib/layout/Section.svelte';
  import EmptyState from '../../lib/ui/EmptyState.svelte';
  import Link from '../../lib/ui/Link.svelte';
  import LinkButton from '../../lib/ui/LinkButton.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Section',
    component: Section,
    parameters: {
      docs: {
        description: {
          component:
            'A titled block of a page — a `<section aria-labelledby>` pointing at its own heading, so it is a named region a reader can jump between. `count` is the unpaged total and is deliberately separate from the rows, because a section shows a preview beside the real number. `empty` swaps the rows for an honest empty state rather than an empty list.',
        },
      },
    },
  });

  const observations = ['14 September — two seedlings', '2 September — sown', '30 August — soil turned'];
</script>

<Story name="Rows, a count and an action">
  <Section title="Observations" count={1284} description="The most recent three of 1,284.">
    {#snippet actions()}<Link href="/observations">See all</Link>{/snippet}
    <ul class="divide-base-300 divide-y">
      {#each observations as observation (observation)}
        <li class="py-3">{observation}</li>
      {/each}
    </ul>
  </Section>
</Story>

<Story name="Empty, with the default message">
  <Section title="Chemistry" empty>
    <p>Never rendered — `empty` is set.</p>
  </Section>
</Story>

<Story name="Empty, with an EmptyState">
  <Section title="Gardens" empty>
    {#snippet emptyState()}
      <EmptyState
        title="No gardens yet"
        description="A garden is a place you grow things — a balcony, a bed, a whole block."
        headingLevel={3}
      >
        {#snippet icon()}<Sprout class="size-10" />{/snippet}
        {#snippet action()}
          <LinkButton href="/gardens/new" tone="primary">Start a garden</LinkButton>
        {/snippet}
      </EmptyState>
    {/snippet}
    <p>Never rendered.</p>
  </Section>
</Story>

<Story name="Nested, as an h3">
  <section class="space-y-6">
    <h2 class="text-2xl font-semibold">Anatomy</h2>
    <Section title="Tissues" headingLevel={3} count={4}>
      <ul class="list-inside list-disc"><li>Epidermis</li><li>Cortex</li></ul>
    </Section>
  </section>
</Story>
