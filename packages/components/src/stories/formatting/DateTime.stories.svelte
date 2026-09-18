<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DateTime from '../../lib/formatting/DateTime.svelte';

  const { Story } = defineMeta({
    title: 'Formatting/DateTime',
    component: DateTime,
    args: { value: '2026-09-17T09:30:00Z' },
    parameters: {
      docs: {
        description: {
          component:
            'A `<time>` element: the ISO instant in `datetime`, `Intl.DateTimeFormat`\'s locale rendering as the visible text (or `children`, when given, which replaces only the text).',
        },
      },
    },
  });
</script>

<Story name="Default (medium date style)" />

<Story name="Date and time" args={{ dateStyle: 'long', timeStyle: 'short' }} />

<Story name="Time only" args={{ options: { timeStyle: 'short' } }} />

<Story name="Raw options" args={{ options: { year: 'numeric', month: 'long' } }} />

<Story name="German locale" args={{ locales: 'de-DE', dateStyle: 'long' }} />

<Story name="Custom children">
  {#snippet template(args)}
    <DateTime {...args}>
      {#snippet children()}
        <strong>Published {new Date(args.value).getFullYear()}</strong>
      {/snippet}
    </DateTime>
  {/snippet}
</Story>
