<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import VisuallyHidden from '../../lib/ui/VisuallyHidden.svelte';

  const { Story } = defineMeta({
    title: 'UI/VisuallyHidden',
    component: VisuallyHidden,
    parameters: {
      docs: {
        description: {
          component:
            'Renders its children into the accessibility tree only. Nothing below is visible — turn on the a11y panel, or inspect the DOM, to see what a screen reader is given.',
        },
      },
    },
  });
</script>

<!--
  Two stories, both deliberately showing NOTHING new on screen: the whole
  point of the component is that the visual rendering is unchanged. What
  differs is what the accessibility tree carries.
-->

<Story name="Rating">
  <p class="text-base-content">
    <span aria-hidden="true">★★★☆☆</span>
    <VisuallyHidden>3 out of 5 stars</VisuallyHidden>
  </p>
</Story>

<Story name="Icon button name">
  <button class="btn btn-square btn-primary" type="button">
    <span aria-hidden="true">×</span>
    <VisuallyHidden>Dismiss notification</VisuallyHidden>
  </button>
</Story>

<Story name="Skip link (revealed on focus)">
  <a href="#main" class="btn btn-sm focus:not-sr-only">
    <VisuallyHidden class="focus:not-sr-only">Skip to main content</VisuallyHidden>
  </a>
</Story>
