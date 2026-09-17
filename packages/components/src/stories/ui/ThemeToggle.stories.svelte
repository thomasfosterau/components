<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ThemeToggle from '../../lib/ui/ThemeToggle.svelte';

  const { Story } = defineMeta({
    title: 'UI/ThemeToggle',
    component: ThemeToggle,
    parameters: {
      docs: {
        description: {
          component:
            'The light / dark switch: a checkbox with `role="switch"` named by `label`, which writes the chosen theme name to `document.documentElement.dataset.theme` and remembers it under `storageKey`. The theme NAMES are props — this library ships tokens, not a brand. The pre-paint script that stops a returning visitor flashing the wrong theme is the app’s job; see the component’s header comment.',
        },
      },
    },
  });
</script>

<!--
  The story key is deliberately its own, so toggling here never overwrites an
  app’s remembered theme. Note that toggling DOES write to `localStorage` —
  that is the component’s contract, and the only thing a story can do about
  it is not share the key.
-->
<Story name="Default">
  <div class="flex items-center gap-4">
    <ThemeToggle lightTheme="light" darkTheme="dark" storageKey="storybook:theme-toggle-demo" />
    <p class="text-base-content/70 text-sm">Switches the whole preview between the two themes.</p>
  </div>
</Story>

<Story name="Custom label">
  <ThemeToggle
    lightTheme="light"
    darkTheme="dark"
    storageKey="storybook:theme-toggle-demo"
    label="Switch to the dark theme"
  />
</Story>
