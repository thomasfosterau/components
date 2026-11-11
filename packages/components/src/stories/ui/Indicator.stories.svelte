<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Bell } from '@lucide/svelte';
  import Avatar from '../../lib/ui/Avatar.svelte';
  import Badge from '../../lib/ui/Badge.svelte';
  import Card from '../../lib/ui/Card.svelte';
  import IconButton from '../../lib/ui/IconButton.svelte';
  import Indicator from '../../lib/ui/Indicator.svelte';
  import StatusDot from '../../lib/ui/StatusDot.svelte';

  const { Story } = defineMeta({
    title: 'UI/Indicator',
    component: Indicator,
    parameters: {
      docs: {
        description: {
          component:
            "Positions a mark on a corner or edge of its children with daisyUI's `indicator`. The mark comes after the element in the DOM, and sits outside it: put a count in the button's own name too.",
        },
      },
    },
  });
</script>

{#snippet count()}<Badge tone="error" size="sm">3</Badge>{/snippet}
{#snippet unread()}<StatusDot tone="primary" label="Unread messages" />{/snippet}
{#snippet fresh()}<Badge tone="primary" size="sm">New</Badge>{/snippet}

<Story name="Count on an icon button">
  <Indicator item={count}>
    <IconButton label="Notifications, 3 unread">
      {#snippet icon()}<Bell class="size-5" />{/snippet}
    </IconButton>
  </Indicator>
</Story>

<Story name="Unread dot on an avatar">
  <Indicator item={unread} placement="bottom-end">
    <Avatar name="Thomas Foster" />
  </Indicator>
</Story>

<Story name="New on a card">
  <Indicator item={fresh} placement="top-start">
    <Card title="Bed 4">Tomatoes and basil.</Card>
  </Indicator>
</Story>
