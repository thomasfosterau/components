<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import LinkButton from '../../lib/ui/LinkButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/LinkButton',
    component: LinkButton,
    parameters: {
      docs: {
        description: {
          component:
            'Navigation that reads as an action. It is an `<a>`, so it keeps middle-click and "copy link address"; a disabled one keeps its text but drops its `href` and gains `role="button"` + `aria-disabled` so the state is still announced.',
        },
      },
    },
  });
</script>

<Story name="Tones">
  <div class="flex flex-wrap gap-2">
    <LinkButton href="/gardens">All gardens</LinkButton>
    <LinkButton href="/gardens/new" tone="primary">Start a garden</LinkButton>
    <LinkButton href="/gardens/1/edit" tone="secondary" variant="outline">Edit</LinkButton>
  </div>
</Story>

<Story name="Disabled">
  <LinkButton href="/gardens/new" tone="primary" disabled>Start a garden</LinkButton>
</Story>

<Story name="External">
  <LinkButton href="https://example.org/handbook" tone="primary" variant="outline" external>
    Read the handbook
  </LinkButton>
</Story>
