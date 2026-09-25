<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import Head from '../../lib/seo/Head.svelte';
  import HeadInspector from './HeadInspector.svelte';

  const { Story } = defineMeta({
    title: 'SEO/Head',
    component: Head,
    parameters: {
      docs: {
        description: {
          component:
            'Per-page `<head>` metadata. It renders nothing in the body, so the table below (Storybook only) lists what it emitted into `<head>`: title, canonical on the production origin, `hreflang` alternates, Open Graph and Twitter / X tags, and the share image.',
        },
      },
    },
  });

  const canonicalHref = (path: string): string => new URL(path, 'https://example.org').href;
</script>

<Story name="A page">
  <HeadInspector>
    <Head
      title="About"
      siteName="Example"
      description="Who we are and what we grow."
      pathname="/about"
      {canonicalHref}
      locales={['en-AU', 'es-419']}
      defaultImage={{ url: 'https://example.org/og-default.png', alt: 'Example', width: 1200, height: 630, type: 'image/png' }}
    />
  </HeadInspector>
</Story>

<Story name="An article with a share card">
  <HeadInspector>
    <Head
      title="Pruning dog roses"
      siteName="Example"
      description="When and how far to cut back Rosa canina."
      type="BlogPosting"
      pathname="/posts/pruning-dog-roses"
      {canonicalHref}
      shareCard={{ id: 'pruning-dog-roses', title: 'Pruning dog roses', description: 'When and how far to cut back Rosa canina.', updatedAt: '2026-05-01T10:00:00Z' }}
      published={new Date('2026-04-15T09:00:00Z')}
      section="Gardening"
      tags={['roses', 'pruning']}
      feed={{ path: '/feed.json' }}
    />
  </HeadInspector>
</Story>

<Story name="Not indexed">
  <HeadInspector>
    <Head title="Settings" siteName="Example" robots={{ index: false, follow: false }} />
  </HeadInspector>
</Story>
