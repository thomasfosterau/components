<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import RadioGroup from '../../lib/fields/RadioGroup.svelte';

  const { Story } = defineMeta({
    title: 'Fields/RadioGroup',
    component: RadioGroup,
    parameters: {
      docs: {
        description: {
          component:
            'One choice from a short list, on bits-ui’s `RadioGroup`: the group is a single tab stop and the arrow keys move within it. It is the one field group not built on `Fieldset` — a `role="radiogroup"` cannot be named by a `<legend>`, so it renders its question and points `aria-labelledby` at it.',
        },
      },
    },
  });

  const visibility = [
    { value: 'public', label: 'Anyone can see this garden' },
    { value: 'followers', label: 'Only people who follow me' },
    { value: 'private', label: 'Only me' },
  ];

  const plans = [
    { value: 'free', label: 'Free', description: 'One garden, ten plants, community support.' },
    { value: 'grower', label: 'Grower', description: 'Unlimited gardens, harvest logs and reminders.' },
    { value: 'market', label: 'Market', description: 'Everything in Grower, plus sales and stock tracking.' },
    { value: 'co-op', label: 'Co-op', description: 'Shared gardens for groups.', disabled: true },
  ];
</script>

<script lang="ts">
  let chosen = $state('followers');
  let plan = $state('grower');
</script>

<Story name="Vertical">
  <div class="max-w-sm">
    <RadioGroup
      legend="Who can see this garden"
      hint="You can change this at any time."
      name="visibility"
      options={visibility}
      bind:value={chosen}
    />
    <p class="text-base-content/70 mt-3 text-sm">Chosen: {chosen}</p>
  </div>
</Story>

<Story name="Horizontal">
  <RadioGroup
    legend="Sort by"
    orientation="horizontal"
    options={['Newest', 'Oldest', 'Name']}
    value="Newest"
  />
</Story>

<Story name="Required, with errors">
  <div class="max-w-sm">
    <RadioGroup
      legend="Who can see this garden"
      required
      errors={['Choose who can see this garden.']}
      options={visibility}
      value=""
    />
  </div>
</Story>

<Story name="Cards">
  <RadioGroup legend="Plan" name="plan" variant="cards" options={plans} bind:value={plan} />
</Story>

<Story name="Cards, custom body">
  <RadioGroup legend="Plan" variant="cards" columns={2} indicator="start" options={plans} value="free">
    {#snippet card(option, { checked })}
      <span class="font-semibold">{option.label}</span>
      <span class="text-base-content/70 text-sm">{option.description}</span>
      {#if checked}<span class="text-primary text-xs font-semibold">Current choice</span>{/if}
    {/snippet}
  </RadioGroup>
</Story>
