<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ExternalLink from '../../lib/ui/ExternalLink.svelte';

  const { Story } = defineMeta({
    title: 'UI/ExternalLink',
    component: ExternalLink,
    parameters: {
      docs: {
        description: {
          component:
            'A link off the site with the `rel` decision made for the call site: user-supplied addresses get `nofollow`, addresses the site composed itself do not. The new tab is announced to assistive technology, not only drawn as an icon.',
        },
      },
    },
  });
</script>

<Story name="Untrusted (the default)">
  <p class="text-base-content">
    Homepage: <ExternalLink href="https://example.com/~member">example.com/~member</ExternalLink>
  </p>
</Story>

<Story name="Trusted resolver">
  <p class="text-base-content">
    ORCID:
    <ExternalLink href="https://orcid.org/0000-0002-1825-0097" untrusted={false}>
      0000-0002-1825-0097
    </ExternalLink>
  </p>
</Story>

<Story name="Without the icon">
  <p class="text-base-content">
    Source: <ExternalLink href="https://example.org/paper" showIcon={false}>the paper</ExternalLink>
  </p>
</Story>
