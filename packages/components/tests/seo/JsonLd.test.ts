import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import JsonLd from '../../src/lib/seo/JsonLd.svelte';

const blocks = (): HTMLScriptElement[] =>
  Array.from(document.head.querySelectorAll('script[type="application/ld+json"]'));

test('emits one application/ld+json block in the head, parseable back to the data', async () => {
  const data = { '@context': 'https://schema.org', '@type': 'WebSite', name: 'Example' };
  await render(JsonLd, { data });

  const [block, ...rest] = blocks();
  expect(rest).toHaveLength(0);
  expect(JSON.parse(block?.textContent ?? '')).toEqual(data);
});

test('an authored </script> cannot break out of the block', async () => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '</script><img src=x onerror=alert(1)>',
  };
  await render(JsonLd, { data });

  expect(document.head.querySelector('img')).toBeNull();
  expect(JSON.parse(blocks()[0]?.textContent ?? '')).toEqual(data);
});

test('an authored <!-- cannot swallow the closing tag or leak into the head', async () => {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '<!--<script>',
    description: '--></script><img src=x onerror=alert(1)>',
  };
  await render(JsonLd, { data });

  expect(blocks()).toHaveLength(1);
  expect(document.head.querySelector('img')).toBeNull();
  expect(JSON.parse(blocks()[0]?.textContent ?? '')).toEqual(data);
});

test('null and undefined render nothing', async () => {
  await render(JsonLd, { data: null });
  await render(JsonLd, { data: undefined });
  expect(blocks()).toHaveLength(0);
});
