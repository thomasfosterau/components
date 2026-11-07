<script module lang="ts">
  import { ChevronRight, CloudRain, MapPin } from '@lucide/svelte';
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import IconLabel from '../../lib/ui/IconLabel.svelte';

  const { Story } = defineMeta({
    title: 'UI/IconLabel',
    component: IconLabel,
    parameters: {
      docs: {
        description: {
          component:
            'An icon beside a title. The title is real text in every style, visible or visually hidden, so a containing control takes its name from it; the icon is `aria-hidden` and sized `1em`, so the pair scales with the text around it.',
        },
      },
    },
  });
</script>

{#snippet rain()}<CloudRain />{/snippet}
{#snippet pin()}<MapPin />{/snippet}
{#snippet chevron()}<ChevronRight />{/snippet}

<Story name="Styles">
  <ul class="space-y-2">
    <li><IconLabel title="12 mm" icon={rain} /></li>
    <li><IconLabel title="Bed 4" icon={pin} labelStyle="title-only" /></li>
    <li>
      <button type="button" class="btn btn-ghost btn-square">
        <IconLabel title="Rain" icon={rain} labelStyle="icon-only" />
      </button>
    </li>
  </ul>
</Story>

<Story name="Trailing icon, at a larger size">
  <p class="text-2xl"><IconLabel title="Next bed" icon={chevron} trailingIcon /></p>
</Story>
