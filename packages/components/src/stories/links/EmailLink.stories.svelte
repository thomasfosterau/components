<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import EmailLink from '../../lib/links/EmailLink.svelte';

  const { Story } = defineMeta({
    title: 'Links/EmailLink',
    component: EmailLink,
    args: { email: 'hello@thomasfoster.au' },
    parameters: {
      docs: {
        description: {
          component:
            'A `mailto:` anchor; `subject`/`body`/`cc`/`bcc` are assembled into the query string with `URLSearchParams`.',
        },
      },
    },
  });
</script>

<Story name="Default (address as text)" />

<Story name="With subject and body" args={{ subject: 'Question about your garden', body: 'Hi there,' }} />

<Story name="With cc and bcc" args={{ cc: 'team@thomasfoster.au', bcc: 'archive@thomasfoster.au' }} />

<Story name="Custom link text">
  {#snippet template(args)}
    <EmailLink {...args}>
      {#snippet children()}Contact us{/snippet}
    </EmailLink>
  {/snippet}
</Story>
