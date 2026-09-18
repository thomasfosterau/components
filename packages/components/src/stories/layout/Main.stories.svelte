<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Main from '../../lib/layout/Main.svelte';

  const { Story } = defineMeta({
    title: 'Layout/Main',
    component: Main,
    parameters: {
      docs: {
        description: {
          component:
            'The page content column and the `<main>` landmark that names it — the one a screen-reader user jumps to with a single keystroke, and the target of a skip link. `as="section"` is for a block mounted inside a shell that has already opened the real `<main>`, because there must never be two.',
        },
      },
    },
  });
</script>

<Story name="The main landmark">
  <Main class="space-y-4">
    <h1 class="text-3xl font-semibold">Rosa canina</h1>
    <p class="max-w-prose leading-7">
      The dog rose is a climbing wild rose native to Europe, north-west Africa and western Asia.
      Everything a reader came for is inside this landmark.
    </p>
  </Main>
</Story>

<Story name="Nested, as a named region">
  <main class="space-y-6">
    <h1 class="text-3xl font-semibold">Gardens</h1>
    <Main as="section" aria-label="Recently watered" class="space-y-2">
      <h2 class="text-xl font-semibold">Recently watered</h2>
      <p class="text-base-content/70">
        A `&lt;section&gt;` is a landmark only once it has an accessible name, so the nested case
        takes an `aria-label`.
      </p>
    </Main>
  </main>
</Story>
