<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';
  import Card from '../../lib/ui/Card.svelte';
  import Divider from '../../lib/ui/Divider.svelte';

  const { Story } = defineMeta({
    title: 'UI/Divider',
    component: Divider,
    parameters: {
      docs: {
        description: {
          component:
            'A rule between sections or side-by-side items. Unlabelled it is a `separator`; labelled ("or") its text reads in flow, because a separator\'s children are presentational. `decorative` hides it entirely.',
        },
      },
    },
  });

  const tones = ['neutral', 'primary', 'secondary', 'accent', 'info', 'success', 'warning', 'error'] as const;
</script>

<Story name="Horizontal">
  <div class="max-w-md">
    <p>Sowing notes for the north bed.</p>
    <Divider />
    <p>Harvest notes for the north bed.</p>
  </div>
</Story>

<Story name="Vertical between two cards">
  <div class="flex max-w-2xl">
    <Card class="grow"><p class="p-4">Annuals</p></Card>
    <Divider orientation="vertical" />
    <Card class="grow"><p class="p-4">Perennials</p></Card>
  </div>
</Story>

<Story name="Labelled 'or'">
  <div class="flex max-w-xs flex-col">
    <Button tone="primary">Sign in with a passkey</Button>
    <Divider>or</Divider>
    <Button variant="outline">Continue with email</Button>
  </div>
</Story>

<Story name="Label alignment">
  <div class="max-w-md">
    <Divider align="start">Start</Divider>
    <Divider>Centre</Divider>
    <Divider align="end">End</Divider>
  </div>
</Story>

<Story name="Tones">
  <div class="max-w-md">
    {#each tones as tone (tone)}
      <Divider {tone}>{tone}</Divider>
    {/each}
  </div>
</Story>

<Story name="Decorative">
  <div class="max-w-md">
    <p>A flourish between two paragraphs of one section.</p>
    <Divider decorative />
    <p>Nothing is announced for the rule.</p>
  </div>
</Story>
