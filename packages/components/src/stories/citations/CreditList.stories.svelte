<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import CreditList, { type Credit } from '../../lib/citations/CreditList.svelte';

  const authors: readonly Credit[] = [
    { name: 'Smith, J.', href: '/people/smith-j', itemtype: 'Person' },
    { name: 'Jones, A.', href: '/people/jones-a', itemtype: 'Person' },
  ];
  const editors: readonly Credit[] = [
    { name: 'Harden, G. J.', href: '/people/harden-g', itemtype: 'Person' },
  ];
  const translators: readonly Credit[] = [
    { name: 'Dubois, M.', itemtype: 'Person' },
    { name: 'Nguyen, T.', itemtype: 'Person' },
  ];
  /** An Agent that did not resolve, surviving only as plain text — no itemtype, no link. */
  const unresolved: readonly Credit[] = [{ name: 'Unknown collector' }];

  const { Story } = defineMeta({
    title: 'Citations/CreditList',
    component: CreditList,
    tags: ['autodocs'],
  });
</script>

<Story name="Authors, no role label">
  <CreditList credits={authors} role="author" />
</Story>

<Story name="A single editor — (ed)">
  <CreditList credits={editors} role="editor" />
</Story>

<Story name="Two editors — (eds)">
  <CreditList credits={[...editors, { name: 'Second, E.' }]} role="editor" />
</Story>

<Story name="Translators — trans. before the names">
  <CreditList credits={translators} role="translator" />
</Story>

<Story name="An unresolved credit renders as plain text">
  <CreditList credits={unresolved} role="author" />
</Story>

<Story name="Custom role and label">
  <CreditList
    credits={[{ name: 'García, R.', itemtype: 'Person' }]}
    role="illustrator"
    roleLabel={(n) => (n > 1 ? '(illus.)' : '(illus.)')}
    roleLabelPosition="after"
  />
</Story>

<Story name="Organizations, not people">
  <CreditList
    credits={[{ name: 'Royal Botanic Gardens', itemtype: 'Organization', href: '/organisations/rbg' }]}
    role="author"
  />
</Story>
