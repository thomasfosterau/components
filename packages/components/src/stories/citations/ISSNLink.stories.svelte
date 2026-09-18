<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import ISSNLink from '../../lib/citations/ISSNLink.svelte';

  const { Story } = defineMeta({ title: 'Citations/ISSNLink', component: ISSNLink, tags: ['autodocs'] });
</script>

<Story name="Default">
  <ISSNLink issn="1030-1887" />
</Story>

<Story name="With Schema.org itemprop">
  <ISSNLink issn="1030-1887" itemprop="issn" />
</Story>
