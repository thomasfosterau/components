<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import EntityForm from '../../lib/forms/EntityForm.svelte';
  import { bedForm } from './entity-form-demo.ts';

  const { Story } = defineMeta({
    title: 'Forms/EntityForm',
    component: EntityForm,
    parameters: {
      docs: {
        description: {
          component:
            "`@thomasfosterau/components/entity-form`: renders an `@thomasfosterau/effect-forms-svelte` `defineEntityForm` definition through this library's field primitives. The Garden picker is a bespoke widget, bridged through `name` / `value` / `onChange` / `errors`, and gates the submit button until it has a value. Submitting here posts nowhere.",
        },
      },
    },
  });
</script>

<Story name="Create">
  <EntityForm definition={bedForm} mode="create" cancelHref="/beds" onsubmit={(event) => event.preventDefault()} />
</Story>

<Story name="Update">
  <EntityForm
    definition={bedForm}
    mode="update"
    cancelHref="/beds/4"
    initial={{
      id: '0b54f5a1-6f2d-4f4e-9a0f-2f63c1f6a111',
      name: 'Bed 4',
      gardenId: 'kitchen',
      notes: 'Dog roses along the fence.',
      planted: '2026-04-15',
      status: 'published',
    }}
    onsubmit={(event) => event.preventDefault()}
  />
</Story>
