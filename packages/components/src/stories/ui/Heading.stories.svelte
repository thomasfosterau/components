<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Heading from '../../lib/ui/Heading.svelte';

  const { Story } = defineMeta({
    title: 'UI/Heading',
    component: Heading,
    parameters: {
      docs: {
        description: {
          component:
            'A real heading at the level the caller names, with an id derived from its text AT RENDER — so the anchor exists in the server-rendered HTML rather than appearing after hydration. A snippet heading that wants an anchor must be given an explicit `id`.',
        },
      },
    },
  });
</script>

<Story name="Levels">
  <div>
    <Heading level={1}>Growing conditions</Heading>
    <Heading level={2}>Light &amp; aspect</Heading>
    <Heading level={3}>Full sun</Heading>
    <Heading level={4}>In containers</Heading>
    <Heading level={5}>On a south wall</Heading>
    <Heading level={6}>Notes</Heading>
  </div>
</Story>

<!-- The ids below are `growing-conditions` and `light-aspect`, slugged from the text itself. -->
<Story name="With anchors">
  <div>
    <Heading level={2} anchor>Growing conditions</Heading>
    <p class="max-w-prose">Hover the heading to reveal its permalink.</p>
    <Heading level={2} anchor>Pests and diseases</Heading>
    <p class="max-w-prose">Each heading addresses itself without the caller slugifying by hand.</p>
  </div>
</Story>

<Story name="A snippet heading needs an explicit id">
  <Heading level={2} id="rosa-canina" anchor>
    {#snippet children()}<em>Rosa canina</em> in cultivation{/snippet}
  </Heading>
</Story>
