import { describe, expect, it } from 'vite-plus/test';
import { cleanup, render } from 'vitest-browser-svelte';
import Head from '../../src/lib/seo/Head.svelte';
import HeadWithContext from './fixtures/HeadWithContext.svelte';

const meta = (key: string): string | null =>
  document.head
    .querySelector(`meta[property="${key}"], meta[name="${key}"]`)
    ?.getAttribute('content') ?? null;
const metas = (key: string): string[] =>
  Array.from(
    document.head.querySelectorAll(`meta[property="${key}"]`),
    (el) => el.getAttribute('content') ?? '',
  );
const link = (rel: string): string | null =>
  document.head.querySelector(`link[rel="${rel}"]:not([hreflang])`)?.getAttribute('href') ?? null;
const alternates = (): { lang: string | null; href: string | null }[] =>
  Array.from(document.head.querySelectorAll('link[rel="alternate"][hreflang]'), (el) => ({
    lang: el.getAttribute('hreflang'),
    href: el.getAttribute('href'),
  }));

describe('title', () => {
  it('suffixes the site name and mirrors it into og:title and twitter:title', async () => {
    await render(Head, { title: 'About', siteName: 'Example' });
    expect(document.title).toBe('About | Example');
    expect(meta('og:title')).toBe('About | Example');
    expect(meta('twitter:title')).toBe('About | Example');
    expect(meta('og:site_name')).toBe('Example');
  });

  it('renders the site name alone for a blank title, and the title alone with no site name', async () => {
    await render(Head, { title: ' ', siteName: 'Example' });
    expect(document.title).toBe('Example');
    cleanup();
    await render(Head, { title: 'About' });
    expect(document.title).toBe('About');
    expect(meta('og:site_name')).toBeNull();
  });

  it('takes a custom separator', async () => {
    await render(Head, { title: 'About', siteName: 'Example', titleSeparator: ' · ' });
    expect(document.title).toBe('About · Example');
  });
});

describe('description and robots', () => {
  it('emits the description three ways, and omits all three when absent', async () => {
    await render(Head, { title: 'T', description: 'A page.' });
    expect(meta('description')).toBe('A page.');
    expect(meta('og:description')).toBe('A page.');
    expect(meta('twitter:description')).toBe('A page.');

    cleanup();
    await render(Head, { title: 'T', description: null });
    expect(meta('description')).toBeNull();
    expect(meta('og:description')).toBeNull();
  });

  it('defaults robots to index, follow and honours an override', async () => {
    await render(Head, { title: 'T' });
    expect(meta('robots')).toBe('index, follow');
    cleanup();
    await render(Head, { title: 'T', robots: { index: false, follow: false } });
    expect(meta('robots')).toBe('noindex, nofollow');
  });

  it('joins keywords', async () => {
    await render(Head, { title: 'T', keywords: ['roses', 'gardens'] });
    expect(meta('keywords')).toBe('roses, gardens');
  });
});

describe('canonical', () => {
  it('self-references pathname through the context href, on the production origin', async () => {
    await render(HeadWithContext, { title: 'T', pathname: '/posts/some-post' });
    expect(link('canonical')).toBe('https://example.org/posts/some-post');
    expect(meta('og:url')).toBe('https://example.org/posts/some-post');
  });

  it('prefers an explicit canonicalHref over the context', async () => {
    await render(HeadWithContext, {
      title: 'T',
      pathname: '/about',
      canonicalHref: (path: string) => `https://canonical.example${path}`,
    });
    expect(link('canonical')).toBe('https://canonical.example/about');
  });

  it('lets an explicit canonical win over pathname', async () => {
    await render(HeadWithContext, {
      title: 'T',
      pathname: '/about',
      canonical: 'https://example.org/elsewhere',
    });
    expect(link('canonical')).toBe('https://example.org/elsewhere');
  });
});

describe('hreflang alternates', () => {
  it('emits one link per locale plus x-default, all pointing at the canonical URL', async () => {
    await render(HeadWithContext, {
      title: 'T',
      pathname: '/posts/a',
      locales: ['en-AU', 'es-419'],
    });
    const links = alternates();
    expect(links.map((l) => l.lang).sort()).toEqual(['en-AU', 'es-419', 'x-default']);
    for (const l of links) expect(l.href).toBe('https://example.org/posts/a');
  });

  it('respects explicit alternates instead of the default', async () => {
    await render(HeadWithContext, {
      title: 'T',
      pathname: '/posts/a',
      locales: ['en-AU'],
      alternates: [{ href: 'https://example.org/fr/custom', lang: 'fr' }],
    });
    expect(alternates()).toEqual([{ lang: 'fr', href: 'https://example.org/fr/custom' }]);
  });

  it('emits none without locales', async () => {
    await render(HeadWithContext, { title: 'T', pathname: '/posts/a' });
    expect(alternates()).toEqual([]);
  });
});

describe('Open Graph', () => {
  it('derives og:type from the Schema.org type, and og:locale from the context locale', async () => {
    await render(HeadWithContext, { title: 'T', type: 'BlogPosting', locale: 'es-419' });
    expect(meta('og:type')).toBe('article');
    expect(meta('og:locale')).toBe('es_419');
  });

  it('defaults og:type to website', async () => {
    await render(Head, { title: 'T' });
    expect(meta('og:type')).toBe('website');
    expect(meta('og:locale')).toBeNull();
  });

  it('emits article:* only for the article type, with every tag, and treats a blank section as absent', async () => {
    const published = new Date('2026-04-15T09:00:00Z');
    await render(Head, {
      title: 'T',
      openGraphType: 'article',
      published,
      section: '',
      tags: ['roses', 'soil'],
    });
    expect(meta('article:published_time')).toBe(published.toISOString());
    expect(meta('article:section')).toBeNull();
    expect(metas('article:tag')).toEqual(['roses', 'soil']);

    cleanup();
    await render(Head, { title: 'T', openGraphType: 'profile', published, tags: ['roses'] });
    expect(meta('article:published_time')).toBeNull();
    expect(metas('article:tag')).toEqual([]);
  });
});

describe('share image', () => {
  const defaultImage = {
    url: 'https://example.org/og-default.png',
    alt: 'Example',
    width: 1200,
    height: 630,
    type: 'image/png',
  };

  it('falls back to the default image', async () => {
    await render(Head, { title: 'T', defaultImage });
    expect(meta('og:image')).toBe(defaultImage.url);
    expect(meta('twitter:image')).toBe(defaultImage.url);
    expect(meta('og:image:alt')).toBe('Example');
    expect(meta('og:image:width')).toBe('1200');
  });

  it('builds a per-page card on the production origin, with an alt naming page and site', async () => {
    await render(HeadWithContext, {
      title: 'Roses',
      siteName: 'Example',
      defaultImage,
      shareCard: { id: 'abc', title: 'Roses', description: 'Canina' },
    });
    const url = new URL(meta('og:image') ?? '');
    expect(url.origin).toBe('https://example.org');
    expect(url.pathname).toBe('/og/abc.png');
    expect(url.searchParams.get('t')).toBe('Roses');
    expect(meta('og:image:alt')).toBe('Roses — Example');
    expect(meta('og:image:type')).toBe('image/png');
  });

  it('lets an explicit image win over the card', async () => {
    await render(Head, {
      title: 'T',
      image: { url: 'https://example.org/explicit.png' },
      shareCard: { id: 'abc', title: 'T' },
      defaultImage,
    });
    expect(meta('og:image')).toBe('https://example.org/explicit.png');
    expect(meta('og:image:alt')).toBeNull();
  });

  it('emits no image at all when none is configured', async () => {
    await render(Head, { title: 'T' });
    expect(meta('og:image')).toBeNull();
  });
});

describe('links', () => {
  it('advertises a feed through canonicalHref with an English default title', async () => {
    await render(HeadWithContext, { title: 'T', feed: { path: '/feed.json' } });
    const feed = document.head.querySelector('link[rel="alternate"][type="application/feed+json"]');
    expect(feed?.getAttribute('href')).toBe('https://example.org/feed.json');
    expect(feed?.getAttribute('title')).toBe('Latest changes');
  });

  it('emits prev and next', async () => {
    await render(Head, { title: 'T', prevUrl: '/page/1', nextUrl: '/page/3' });
    expect(link('prev')).toBe('/page/1');
    expect(link('next')).toBe('/page/3');
  });
});
