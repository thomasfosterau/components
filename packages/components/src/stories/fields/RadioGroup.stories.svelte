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
</script>

<script lang="ts">
  let chosen = $state('followers');
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
