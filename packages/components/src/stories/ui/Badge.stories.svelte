<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Badge from '../../lib/ui/Badge.svelte';

  const { Story } = defineMeta({
    title: 'UI/Badge',
    component: Badge,
    parameters: {
      docs: {
        description: {
          component:
            'A short inline label. A semantic `tone` for a status; a `colourToken` naming a custom property the consuming theme declares for a subject colour. The badge has no ARIA of its own — its text has to carry the meaning.',
        },
      },
    },
  });
</script>

<Story name="Tones">
  <div class="flex flex-wrap gap-2">
    <Badge>Draft</Badge>
    <Badge tone="primary">Featured</Badge>
    <Badge tone="info">In review</Badge>
    <Badge tone="success">Published</Badge>
    <Badge tone="warning">Needs photos</Badge>
    <Badge tone="error">Overdue</Badge>
  </div>
</Story>

<Story name="Variants and sizes">
  <div class="flex flex-wrap items-center gap-2">
    <Badge tone="primary" variant="solid">Solid</Badge>
    <Badge tone="primary" variant="outline">Outline</Badge>
    <Badge tone="primary" variant="soft">Soft</Badge>
    <Badge tone="primary" variant="dash">Dash</Badge>
    <Badge tone="primary" variant="ghost">Ghost</Badge>
    <Badge tone="primary" size="xs">xs</Badge>
    <Badge tone="primary" size="lg">lg</Badge>
  </div>
</Story>

<!--
  The theme declares the token; the badge only ever names it. An undeclared
  token falls back to the theme's neutral colour, which is what the third
  badge below shows.
-->
<Story name="Subject colour from a theme token">
  <div
    class="flex flex-wrap gap-2"
    style="--demo-sun: var(--color-warning); --demo-shade: var(--color-info)"
  >
    <Badge colourToken="--demo-sun">Full sun</Badge>
    <Badge colourToken="--demo-shade">Deep shade</Badge>
    <Badge colourToken="--demo-undeclared">Unclassified</Badge>
  </div>
</Story>
