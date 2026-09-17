<script module lang="ts">
  import { ChevronRight } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Breadcrumbs from '../../lib/layout/Breadcrumbs.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Breadcrumbs',
    component: Breadcrumbs,
    parameters: {
      docs: {
        description: {
          component:
            'The ancestor trail above a page title: a labelled `<nav>` around an `<ol>`, because a trail is ordered and the order is the meaning. Ancestors are links; the trailing crumb is text carrying `aria-current="page"`, even when it was given an `href` — a link to the page you are on is a link that does nothing.',
        },
      },
    },
  });

  const items = [
    { label: 'Home', href: '/' },
    { label: 'Taxa', href: '/taxa' },
    { label: 'Rosaceae', href: '/taxa/rosaceae' },
    { label: 'Rosa canina' },
  ];
</script>

<Story name="A trail">
  <Breadcrumbs {items} />
</Story>

<Story name="A custom landmark name">
  <Breadcrumbs {items} label="You are here" />
</Story>

<Story name="Per-crumb markup">
  <Breadcrumbs {items}>
    {#snippet item(crumb, index)}
      <span class="flex items-center gap-1">
        {#if index > 0}<ChevronRight class="size-3 opacity-50" aria-hidden="true" />{/if}
        {#if crumb.href !== undefined && index < items.length - 1}
          <a href={crumb.href} class="link link-hover">{crumb.label}</a>
        {:else}
          <em class="text-base-content">{crumb.label}</em>
        {/if}
      </span>
    {/snippet}
  </Breadcrumbs>
</Story>

<Story name="One level deep">
  <Breadcrumbs items={[{ label: 'Gardens', href: '/gardens' }, { label: 'Back bed' }]} />
</Story>
