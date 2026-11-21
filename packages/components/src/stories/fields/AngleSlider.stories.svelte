<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import AngleSlider from '../../lib/fields/AngleSlider.svelte';
  import FormField from '../../lib/fields/FormField.svelte';
  import NumberField from '../../lib/fields/NumberField.svelte';

  const { Story } = defineMeta({
    title: 'Fields/AngleSlider',
    component: AngleSlider,
    parameters: {
      docs: {
        description: {
          component:
            'A round dial for an angle or bearing: drag anywhere on it, or use the arrow, Page and Home/End keys; a full circle wraps from 359° to 0°. Pair it with a `NumberField` for typed entry.',
        },
      },
    },
  });

  const slopeMarks = [0, 45, 90, 135, 180].map((value) => ({ value, label: `${value}°` }));
  const rotations = [0, 90, 180, 270].map((value) => ({ value, label: `${value}°` }));
</script>

<script lang="ts">
  let aspect = $state(135);
</script>

<Story name="Compass aspect">
  {#snippet template()}
    <FormField label="Aspect" hint="Which way the bed faces.">
      {#snippet children(control)}
        <AngleSlider {...control} compass value={135} />
      {/snippet}
    </FormField>
  {/snippet}
</Story>

<Story name="Part range">
  {#snippet template()}
    <FormField label="Slope angle" hint="From flat (0°) to vertical and over (180°).">
      {#snippet children(control)}
        <AngleSlider {...control} min={0} max={180} zero="east" marks={slopeMarks} value={30} tone="secondary" />
      {/snippet}
    </FormField>
  {/snippet}
</Story>

<Story name="Marks only">
  {#snippet template()}
    <FormField label="Rotation">
      {#snippet children(control)}
        <AngleSlider {...control} marks={rotations} restrictToMarks value={90} size="sm" />
      {/snippet}
    </FormField>
  {/snippet}
</Story>

<Story name="With a number field">
  {#snippet template()}
    <FormField label="Aspect">
      {#snippet children(control)}
        <div class="flex items-center gap-4">
          <AngleSlider {...control} compass bind:value={aspect} size="lg" />
          <NumberField
            aria-label="Aspect in degrees"
            min={0}
            max={360}
            bind:value={() => aspect, (next) => (aspect = next ?? 0)}
          />
        </div>
      {/snippet}
    </FormField>
  {/snippet}
</Story>
