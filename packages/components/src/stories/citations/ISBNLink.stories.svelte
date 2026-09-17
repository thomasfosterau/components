<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ISBNLink from '../../lib/citations/ISBNLink.svelte';

  const { Story } = defineMeta({ title: 'Citations/ISBNLink', component: ISBNLink, tags: ['autodocs'] });
</script>

<Story name="Default">
  <ISBNLink isbn="9780868405048" />
</Story>

<Story name="With Schema.org itemprop">
  <ISBNLink isbn="9780868405048" itemprop="isbn" />
</Story>
