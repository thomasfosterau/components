<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import DOILink from '../../lib/citations/DOILink.svelte';

  const { Story } = defineMeta({ title: 'Citations/DOILink', component: DOILink, tags: ['autodocs'] });
</script>

<Story name="Default">
  <DOILink doi="10.1071/SB97021" />
</Story>

<Story name="With Schema.org itemprop">
  <DOILink doi="10.1071/SB97021" itemprop="sameAs" />
</Story>

<Story name="Custom rendering of the identifier">
  <DOILink doi="10.1071/SB97021">
    {#snippet children()}
      View the article
    {/snippet}
  </DOILink>
</Story>
