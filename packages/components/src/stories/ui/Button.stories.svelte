<script module lang="ts">
  import { Plus } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Button from '../../lib/ui/Button.svelte';

  const { Story } = defineMeta({
    title: 'UI/Button',
    component: Button,
    parameters: {
      docs: {
        description: {
          component:
            'The daisyUI `btn`. Tone, variant and size come from literal lookup tables; `loading` disables the control and marks it `aria-busy` so the state is announced, not merely animated.',
        },
      },
    },
  });
</script>

<Story name="Tones">
  <div class="flex flex-wrap gap-2">
    <Button>Neutral</Button>
    <Button tone="primary">Primary</Button>
    <Button tone="secondary">Secondary</Button>
    <Button tone="accent">Accent</Button>
    <Button tone="info">Info</Button>
    <Button tone="success">Success</Button>
    <Button tone="warning">Warning</Button>
    <Button tone="error">Error</Button>
  </div>
</Story>

<Story name="Variants">
  <div class="flex flex-wrap gap-2">
    <Button tone="primary" variant="solid">Solid</Button>
    <Button tone="primary" variant="outline">Outline</Button>
    <Button tone="primary" variant="soft">Soft</Button>
    <Button tone="primary" variant="dash">Dash</Button>
    <Button tone="primary" variant="ghost">Ghost</Button>
    <Button tone="primary" variant="link">Link</Button>
  </div>
</Story>

<Story name="Sizes">
  <div class="flex flex-wrap items-center gap-2">
    <Button tone="primary" size="xs">Extra small</Button>
    <Button tone="primary" size="sm">Small</Button>
    <Button tone="primary" size="md">Medium</Button>
    <Button tone="primary" size="lg">Large</Button>
    <Button tone="primary" size="xl">Extra large</Button>
  </div>
</Story>

<Story name="Loading and disabled">
  <div class="flex flex-wrap gap-2">
    <Button tone="primary" loading>Saving changes</Button>
    <Button tone="primary" disabled>Unavailable</Button>
  </div>
</Story>

<Story name="With an icon">
  <Button tone="primary">
    {#snippet icon()}<Plus class="size-4" aria-hidden="true" />{/snippet}
    Add a plant
  </Button>
</Story>

<Story name="Block">
  <div class="max-w-sm">
    <Button tone="primary" block>Continue to checkout</Button>
  </div>
</Story>
