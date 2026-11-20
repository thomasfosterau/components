<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ContextualHelp from '../../lib/fields/ContextualHelp.svelte';
  import FormField from '../../lib/fields/FormField.svelte';
  import TextInput from '../../lib/fields/TextInput.svelte';

  const { Story } = defineMeta({
    title: 'Fields/ContextualHelp',
    component: ContextualHelp,
    parameters: {
      docs: {
        description: {
          component:
            'An ⓘ or ? button that opens an explanatory popover on click, never hover: for a paragraph or a link that is too much for a `Tooltip` and too occasional for an always-visible hint. The trigger is named "Information: <title>"; the panel is a non-modal dialog named by the title.',
        },
      },
    },
  });
</script>

<Story name="Field label" asChild>
  <div class="max-w-sm">
    <FormField label="Hardiness zone" hint="A number from 1 to 13.">
      {#snippet help()}
        <ContextualHelp
          title="Hardiness zone"
          learnMore={{ href: 'https://example.com/zones', label: 'Find your zone' }}
        >
          The coldest winter a plant can survive, as a number from 1 (coldest) to 13. Pick the
          zone for where the garden is, not where you bought the plant.
        </ContextualHelp>
      {/snippet}
      {#snippet children(control)}
        <TextInput {...control} inputmode="numeric" />
      {/snippet}
    </FormField>
  </div>
</Story>

<Story name="Table header" asChild>
  <table class="table max-w-md">
    <thead>
      <tr>
        <th>Plant</th>
        <th>
          Score
          <ContextualHelp title="Growth score">
            Height, yield and health over the season, each out of five, averaged.
          </ContextualHelp>
        </th>
      </tr>
    </thead>
    <tbody>
      <tr><td>Garlic</td><td>4.2</td></tr>
      <tr><td>Kale</td><td>3.8</td></tr>
    </tbody>
  </table>
</Story>

<Story name="Stat tile" asChild>
  <div class="stats card-border">
    <div class="stat">
      <div class="stat-title flex items-center gap-1">
        Water use
        <ContextualHelp title="Water use" placement="bottom">
          Litres per square metre this week, from the rain gauge and your watering log.
        </ContextualHelp>
      </div>
      <div class="stat-value">18 L/m²</div>
    </div>
  </div>
</Story>

<Story name="Help variant" asChild>
  <p class="flex items-center gap-1">
    Import a planting plan
    <ContextualHelp variant="help" title="Importing a plan">
      Export a CSV from your spreadsheet with one row per plant, then drop it on the page. Columns
      are matched by name, and you can fix any that are not.
    </ContextualHelp>
  </p>
</Story>
