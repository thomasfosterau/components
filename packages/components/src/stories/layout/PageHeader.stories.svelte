<script module lang="ts">
  import { Sprout } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import PageHeader from '../../lib/layout/PageHeader.svelte';
  import Badge from '../../lib/ui/Badge.svelte';
  import Button from '../../lib/ui/Button.svelte';
  import LinkButton from '../../lib/ui/LinkButton.svelte';
  import Breadcrumbs from '../../lib/layout/Breadcrumbs.svelte';

  const { Story } = defineMeta({
    title: 'Layout/PageHeader',
    component: PageHeader,
    parameters: {
      docs: {
        description: {
          component:
            'The block at the top of a page: what the page is about, and what you can do to it. One component over the three the apps each had. `title` is a real heading at `headingLevel`; `actions` is a `role="group"` named by `actionsLabel`, so the cluster announces itself as one thing rather than as loose buttons beside a heading.',
        },
      },
    },
  });

  const crumbs = [
    { label: 'Gardens', href: '/gardens' },
    { label: 'Back bed', href: '/gardens/back-bed' },
    { label: 'Tomato ‘Black Krim’' },
  ];
</script>

<Story name="Title only">
  <PageHeader title="Gardens" />
</Story>

<Story name="Every region">
  <PageHeader title="Tomato ‘Black Krim’" subtitle="Solanum lycopersicum · sown 14 September">
    {#snippet eyebrow()}<Breadcrumbs items={crumbs} />{/snippet}
    {#snippet icon()}
      <span class="flex size-16 items-center justify-center"><Sprout class="size-8" /></span>
    {/snippet}
    {#snippet meta()}
      <span>Six seeds sown</span>
      <span>Two seedlings</span>
      <span>Last watered yesterday</span>
    {/snippet}
    {#snippet actions()}
      <Button variant="outline" size="sm">Log a watering</Button>
      <LinkButton href="/plants/black-krim/edit" tone="primary" size="sm">Edit</LinkButton>
    {/snippet}
  </PageHeader>
</Story>

<Story name="A snippet title, and content under the block">
  <PageHeader>
    {#snippet title()}
      <span class="flex flex-wrap items-center gap-3">
        <em>Rosa canina</em>
        <Badge tone="success">Verified</Badge>
      </span>
    {/snippet}
    <p class="text-base-content/70 max-w-prose leading-7">
      Anything under the header block — a tab strip, a filter row — goes in `children`.
    </p>
  </PageHeader>
</Story>

<Story name="As an h2, inside a panel">
  <section class="bg-base-200 rounded-box p-6">
    <PageHeader title="Watering schedule" headingLevel={2} subtitle="Runs between 5am and 6am." />
  </section>
</Story>
