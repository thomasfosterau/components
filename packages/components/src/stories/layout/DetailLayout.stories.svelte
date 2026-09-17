<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Breadcrumbs from '../../lib/layout/Breadcrumbs.svelte';
  import DetailLayout from '../../lib/layout/DetailLayout.svelte';
  import Main from '../../lib/layout/Main.svelte';
  import PageHeader from '../../lib/layout/PageHeader.svelte';
  import Section from '../../lib/layout/Section.svelte';
  import Card from '../../lib/ui/Card.svelte';
  import LinkButton from '../../lib/ui/LinkButton.svelte';

  const { Story } = defineMeta({
    title: 'Layout/DetailLayout',
    component: DetailLayout,
    parameters: {
      docs: {
        description: {
          component:
            'The two-column detail shell. On a wide viewport the aside sits to the right of the body; on a phone the order is title → aside → body, because the aside is the facts-at-a-glance block and a reader who has to scroll past the whole article will never reach it. One render, reordered — not two copies. Narrow the viewport to see the reflow.',
        },
      },
    },
  });

  const editions = ['First edition, 1925', 'Revised edition, 1931', 'Facsimile, 1998'];
</script>

<Story name="Header, aside and body">
  <Main>
    <DetailLayout asideLabel="Key facts">
      {#snippet header()}
        <PageHeader title="Rosa canina" subtitle="Dog rose">
          {#snippet eyebrow()}
            <Breadcrumbs
              items={[
                { label: 'Taxa', href: '/taxa' },
                { label: 'Rosaceae', href: '/taxa/rosaceae' },
                { label: 'Rosa canina' },
              ]}
            />
          {/snippet}
          {#snippet actions()}
            <LinkButton href="/taxa/rosa-canina/edit" size="sm" variant="outline">Edit</LinkButton>
          {/snippet}
        </PageHeader>
      {/snippet}

      {#snippet aside()}
        <Card title="Key facts" headingLevel={2}>
          <dl class="space-y-1 text-sm">
            <div class="flex justify-between gap-4"><dt>Family</dt><dd>Rosaceae</dd></div>
            <div class="flex justify-between gap-4"><dt>Genus</dt><dd><em>Rosa</em></dd></div>
            <div class="flex justify-between gap-4"><dt>Habit</dt><dd>Climbing shrub</dd></div>
          </dl>
        </Card>
      {/snippet}

      {#snippet body()}
        <p class="max-w-prose leading-7">
          A climbing wild rose native to Europe, north-west Africa and western Asia. It bears pale
          pink to white flowers and, in autumn, the red hips the species is best known for.
        </p>
        <Section title="Editions" count={editions.length}>
          <ul class="divide-base-300 divide-y">
            {#each editions as edition (edition)}
              <li class="py-3">{edition}</li>
            {/each}
          </ul>
        </Section>
      {/snippet}
    </DetailLayout>
  </Main>
</Story>

<Story name="No aside">
  <Main>
    <DetailLayout>
      {#snippet header()}<PageHeader title="About this project" />{/snippet}
      {#snippet body()}
        <p class="max-w-prose leading-7">
          Without an aside the body simply takes the full width; nothing else changes.
        </p>
      {/snippet}
    </DetailLayout>
  </Main>
</Story>
