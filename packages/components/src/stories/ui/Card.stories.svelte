<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';
  import Card from '../../lib/ui/Card.svelte';

  const { Story } = defineMeta({
    title: 'UI/Card',
    component: Card,
    parameters: {
      docs: {
        description: {
          component:
            'The surface. A bare `<Card>` renders exactly the `card card-border bg-base-100 shadow-sm` the four apps wrote out by hand 56 times, so adopting it is a substitution and not a redesign. `title` is a real heading at `headingLevel`.',
        },
      },
    },
  });
</script>

<Story name="Bare">
  <Card>
    <p>
      The 56 hand-written copies looked exactly like this: a bordered box on `base-100` with a
      padded body.
    </p>
  </Card>
</Story>

<Story name="With a title and actions">
  <Card title="Tomato ‘Black Krim’">
    <p>Sown 14 September, transplanted 12 October. Two of six seedlings survived the frost.</p>
    {#snippet actions()}
      <Button variant="ghost" size="sm">Dismiss</Button>
      <Button tone="primary" size="sm">Open</Button>
    {/snippet}
  </Card>
</Story>

<Story name="Variants">
  <div class="grid gap-4 sm:grid-cols-3">
    <Card title="Border" headingLevel={3}><p>The default.</p></Card>
    <Card title="Dash" headingLevel={3} variant="dash"><p>A provisional surface.</p></Card>
    <Card title="Plain" headingLevel={3} variant="plain"><p>Shadow only.</p></Card>
  </div>
</Story>

<Story name="Sizes">
  <div class="grid gap-4 sm:grid-cols-2">
    <Card title="Extra small" headingLevel={3} size="xs"><p>Tight padding and type.</p></Card>
    <Card title="Large" headingLevel={3} size="lg"><p>Generous padding and type.</p></Card>
  </div>
</Story>

<Story name="Unpadded, with a figure">
  <div class="max-w-sm">
    <Card title="Bed 3, in June" padded={false} bodyClass="p-4">
      {#snippet figure()}
        <div class="bg-base-300 text-base-content/60 flex h-32 items-center justify-center">
          Image
        </div>
      {/snippet}
      <p>`padded={false}` drops the body padding so the caller can place its own.</p>
    </Card>
  </div>
</Story>
