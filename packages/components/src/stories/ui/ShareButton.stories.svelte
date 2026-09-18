<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ShareButton from '../../lib/ui/ShareButton.svelte';

  const { Story } = defineMeta({
    title: 'UI/ShareButton',
    component: ShareButton,
    parameters: {
      docs: {
        description: {
          component:
            'Hands a payload to the platform share sheet — and renders NOTHING where the Web Share API is absent (every desktop Firefox, and the server). A button that opens nothing is worse than no button, and the caller cannot know which it has before hydration, so the decision is made here after mount. Expect an empty story on a browser without the API.',
        },
      },
    },
  });
</script>

<Story name="Default">
  <ShareButton
    title="Tomato ‘Black Krim’"
    text="Two of six seedlings survived the frost."
    url="https://example.org/gardens/1"
  />
</Story>

<Story name="Prominent">
  <ShareButton
    title="Tomato ‘Black Krim’"
    url="https://example.org/gardens/1"
    tone="primary"
    variant="solid"
    size="md"
    label="Share this garden"
  />
</Story>
