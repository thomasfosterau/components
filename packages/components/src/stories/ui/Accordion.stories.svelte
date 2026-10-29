<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Accordion from '../../lib/ui/Accordion.svelte';
  import AccordionItem from '../../lib/ui/AccordionItem.svelte';

  const { Story } = defineMeta({
    title: 'UI/Accordion',
    component: Accordion,
    parameters: {
      docs: {
        description: {
          component:
            'A stack of headed, collapsible sections (the APG accordion, on bits-ui). Each title is a real heading, so the sections appear in a screen reader’s heading list; ↑/↓ and Home/End move between headers. Closed panels stay reachable by find-in-page. For one section on its own, use the native `Disclosure`.',
        },
      },
    },
  });
</script>

{#snippet seasons()}
  <AccordionItem value="spring" title="Spring">
    <p>Sow broad beans and peas; lift and divide perennials.</p>
  </AccordionItem>
  <AccordionItem value="summer" title="Summer">
    <p>Water at dusk, deeply and less often. Pinch out tomato side shoots.</p>
  </AccordionItem>
  <AccordionItem value="autumn" title="Autumn">
    <p>Lift potatoes; sow green manure on empty beds.</p>
  </AccordionItem>
  <AccordionItem value="winter" title="Winter">
    <p>Order seed, clean tools, and plan next year’s rotation.</p>
  </AccordionItem>
{/snippet}

<Story name="Single">
  <div class="max-w-lg"><Accordion type="single">{@render seasons()}</Accordion></div>
</Story>

<Story name="Required">
  <div class="max-w-lg">
    <Accordion type="single" value="spring" required>{@render seasons()}</Accordion>
  </div>
</Story>

<Story name="Multiple">
  <div class="max-w-lg">
    <Accordion type="multiple" value={['spring', 'autumn']}>{@render seasons()}</Accordion>
  </div>
</Story>

<Story name="Plus variant, separate">
  <div class="flex max-w-lg flex-col gap-2">
    <Accordion type="single" variant="plus" joined={false} class="flex flex-col gap-2">
      {@render seasons()}
    </Accordion>
  </div>
</Story>
