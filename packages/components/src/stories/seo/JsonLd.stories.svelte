<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import JsonLd from '../../lib/seo/JsonLd.svelte';
  import HeadInspector from './HeadInspector.svelte';

  const { Story } = defineMeta({
    title: 'SEO/JsonLd',
    component: JsonLd,
    parameters: {
      docs: {
        description: {
          component:
            'One Schema.org JSON-LD block in `<head>`. The headline below contains a literal closing script tag; it is escaped by `serializeJsonLd`, so it cannot close the block.',
        },
      },
    },
  });

  // Split so the story's own `<script>` is not closed by it.
  const closingTag = '<' + '/script>';
</script>

<Story name="An article">
  <HeadInspector>
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `Escaping ${closingTag} & friends`,
        url: 'https://example.org/posts/escaping',
      }}
    />
  </HeadInspector>
</Story>
