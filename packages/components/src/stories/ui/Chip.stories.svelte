<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Chip from '../../lib/ui/Chip.svelte';

  const { Story } = defineMeta({
    title: 'UI/Chip',
    component: Chip,
    parameters: {
      docs: {
        description: {
          component:
            'A colour swatch beside a short code — the unit of a legend or a result row. `title` wraps the code in `<abbr>`, so the expansion is available to hover and to assistive technology alike.',
        },
      },
    },
  });
</script>

<Story name="Legend">
  <ul
    class="flex flex-wrap gap-4"
    style="--demo-ever: var(--color-success); --demo-decid: var(--color-warning)"
  >
    <li><Chip label="EVG" title="Evergreen" colourToken="--demo-ever" /></li>
    <li><Chip label="DEC" title="Deciduous" colourToken="--demo-decid" /></li>
    <li><Chip label="UNK" title="Unrecorded" /></li>
  </ul>
</Story>

<Story name="As a link">
  <p style="--demo-ever: var(--color-success)">
    <Chip label="EVG" title="Evergreen" href="/traits/evergreen" colourToken="--demo-ever" />
  </p>
</Story>

<Story name="Small">
  <p style="--demo-ever: var(--color-success)">
    <Chip label="EVG" title="Evergreen" size="sm" colourToken="--demo-ever" />
  </p>
</Story>
