<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import FormField from '../../lib/fields/FormField.svelte';
  import Rating from '../../lib/fields/Rating.svelte';

  const { Story } = defineMeta({
    title: 'Fields/Rating',
    component: Rating,
    parameters: {
      docs: {
        description: {
          component:
            'A score out of N as stars, on bits-ui’s `RatingGroup`: one Tab stop (`role="slider"`), arrows step, Home / End go to the ends, digits jump. `readonly` renders a static `role="img"` display instead.',
        },
      },
    },
  });
</script>

<Story name="Input">
  <Rating label="How well did it grow?" value={3} />
</Story>

<Story name="Half steps">
  <Rating label="How well did it grow?" value={3.5} allowHalf />
</Story>

<Story name="Read-only display">
  <Rating readonly value={4.5} size="sm" />
</Story>

<Story name="Custom glyph">
  <Rating label="Hardiness" value={2} max={3} tone="success">
    {#snippet item({ state })}
      <span class={['text-lg leading-none', state === 'inactive' ? 'opacity-20' : 'text-success']}>●</span>
    {/snippet}
  </Rating>
</Story>

<Story name="Tones">
  <div class="flex flex-col gap-2">
    <Rating label="Warning" value={4} />
    <Rating label="Primary" value={4} tone="primary" />
    <Rating label="Error" value={4} tone="error" />
  </div>
</Story>

<Story name="Invalid">
  <Rating label="How well did it grow?" invalid />
</Story>

<Story name="Inside FormField">
  <!-- `{...control}` alone names it: the root is `aria-labelledby` the FormField's `labelId`. -->
  <FormField label="How well did it grow?" hint="Five is a bumper crop." errors={['Rate it before saving.']}>
    {#snippet children(control)}
      <Rating {...control} name="score" />
    {/snippet}
  </FormField>
</Story>
