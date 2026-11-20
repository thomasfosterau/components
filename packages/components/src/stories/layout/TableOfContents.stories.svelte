<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Navbar from '../../lib/layout/Navbar.svelte';
  import TableOfContents from '../../lib/layout/TableOfContents.svelte';
  import Heading from '../../lib/ui/Heading.svelte';

  const { Story } = defineMeta({
    title: 'Layout/TableOfContents',
    component: TableOfContents,
    parameters: {
      docs: {
        description: {
          component:
            '"On this page" navigation: in-page links collected from the headings in `container` (or given as `entries`), nested by level. The section being read is `aria-current="location"`, marked with a border and weight; a click scrolls, moves focus to the heading and replaces the hash. Below `collapseBelow` it folds into a closed disclosure.',
        },
      },
    },
  });

  const sections = [
    { id: 'choosing-a-site', title: 'Choosing a site', sub: ['Sun', 'Drainage'] },
    { id: 'preparing-the-soil', title: 'Preparing the soil', sub: ['Testing pH', 'Adding compost'] },
    { id: 'sowing', title: 'Sowing', sub: [] },
    { id: 'aftercare', title: 'Aftercare', sub: ['Watering', 'Mulching'] },
  ];

  const slug = (text: string): string => text.toLowerCase().replaceAll(' ', '-');
</script>

{#snippet article(id: string)}
  <article {id} class="max-w-prose flex-1">
    {#each sections as section (section.id)}
      <Heading level={2} id={`${id}-${section.id}`} anchor>{section.title}</Heading>
      <p class="mb-4">
        A few paragraphs about {section.title.toLowerCase()}. Scroll to watch the contents mark
        the section being read.
      </p>
      <div class="bg-base-200 rounded-box mb-6 h-64"></div>
      {#each section.sub as sub (sub)}
        <Heading level={3} id={`${id}-${slug(sub)}`}>{sub}</Heading>
        <div class="bg-base-200 rounded-box mb-6 h-48"></div>
      {/each}
    {/each}
  </article>
{/snippet}

<Story name="Docs page, sticky">
  <div class="flex items-start gap-8">
    {@render article('docs-article')}
    <TableOfContents container="#docs-article" sticky class="w-56 shrink-0" />
  </div>
</Story>

<Story name="Nested levels">
  <TableOfContents
    collapseBelow={false}
    scrollSpy={false}
    entries={[
      { id: 'a', label: 'Choosing a site', level: 2 },
      { id: 'b', label: 'Sun', level: 3 },
      { id: 'c', label: 'Morning light', level: 4 },
      { id: 'd', label: 'Preparing the soil', level: 2 },
      { id: 'e', label: 'Testing pH', level: 3 },
    ]}
  />
</Story>

<Story name="Mobile, collapsed" parameters={{ viewport: { defaultViewport: 'mobile1' } }}>
  <div class="flex flex-col gap-4">
    <TableOfContents container="#mobile-article" />
    {@render article('mobile-article')}
  </div>
</Story>

<Story name="Under a sticky Navbar">
  <div class="sticky top-0 z-10">
    <Navbar>
      {#snippet start()}
        <a href="/" rel="home" class="text-primary text-xl font-bold">Garden guide</a>
      {/snippet}
    </Navbar>
  </div>
  <div class="flex items-start gap-8 p-4">
    {@render article('navbar-article')}
    <TableOfContents container="#navbar-article" sticky offset={72} class="w-56 shrink-0" />
  </div>
</Story>
