<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import MentionInput from '../../lib/fields/MentionInput.svelte';
  import MentionInputDemo from './MentionInputDemo.svelte';

  const { Story } = defineMeta({
    title: 'Fields/MentionInput',
    component: MentionInput,
    parameters: {
      docs: {
        description: {
          component:
            'A plain textarea where `@`, `#` or `:` opens suggestions at the caret. Arrows highlight, Enter or Tab inserts, Escape closes. Mentions are stored with stable ids as `@[label](id)`; Backspace after one removes it whole.',
        },
      },
    },
  });
</script>

<Story name="Comment box" asChild>
  <MentionInputDemo />
</Story>

<Story name="Single line" asChild>
  <MentionInputDemo singleLine />
</Story>
