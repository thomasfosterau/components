<!-- Three seasons, with the bound value echoed into an output, so a test can
     read what the Accordion reports back. -->
<script lang="ts">
  import Accordion from '../../../src/lib/ui/Accordion.svelte';
  import AccordionItem from '../../../src/lib/ui/AccordionItem.svelte';
  import type { HeadingLevel } from '../../../src/lib/ui/tones.ts';

  interface Props {
    type?: 'single' | 'multiple' | undefined;
    required?: boolean | undefined;
    headingLevel?: HeadingLevel | undefined;
    searchable?: boolean | undefined;
    initial?: string | undefined;
  }

  let { type = 'single', required = false, headingLevel, searchable, initial = '' }: Props = $props();

  // svelte-ignore state_referenced_locally
  let single = $state(initial);
  let multiple = $state<readonly string[]>([]);
</script>

{#snippet seasons()}
  <AccordionItem value="spring" title="Spring">Sow broad beans.</AccordionItem>
  <AccordionItem value="summer" title="Summer">Water at dusk.</AccordionItem>
  <AccordionItem value="autumn" title="Autumn" disabled>Lift the potatoes.</AccordionItem>
{/snippet}

{#if type === 'single'}
  <Accordion type="single" bind:value={single} {required} {headingLevel} {searchable}>
    {@render seasons()}
  </Accordion>
  <output data-testid="value">{single}</output>
{:else}
  <Accordion type="multiple" bind:value={multiple} {headingLevel} {searchable}>
    {@render seasons()}
  </Accordion>
  <output data-testid="value">{multiple.join(',')}</output>
{/if}
