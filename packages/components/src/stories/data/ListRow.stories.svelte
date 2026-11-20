<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ListRow from '../../lib/data/ListRow.svelte';

  const { Story } = defineMeta({
    title: 'Data/ListRow',
    component: ListRow,
    parameters: {
      docs: {
        description: {
          component:
            'One row: leading content, overline / headline / supporting text, and trailing content. With `href` the whole row is one link, with `onclick` one button; otherwise the control in `trailing` is the Tab stop, named by the headline. Inside a `ListGroup` it renders its own `<li>`.',
        },
      },
    },
  });
</script>

<Story name="Link row" asChild>
  <ListRow headline="Units" supporting="How distances read." href="#units" class="max-w-md">
    {#snippet trailing()}<span class="text-base-content/70">Metric</span>{/snippet}
  </ListRow>
</Story>

<Story name="Control row" asChild>
  <ListRow headline="Email digests" supporting="A summary every Monday." class="max-w-md">
    {#snippet trailing({ labelledBy, describedBy })}
      <input
        type="checkbox"
        role="switch"
        class="toggle"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
      />
    {/snippet}
  </ListRow>
</Story>

<Story name="Destructive button row" asChild>
  <ListRow headline="Delete account" tone="error" onclick={() => {}} class="max-w-md" />
</Story>
