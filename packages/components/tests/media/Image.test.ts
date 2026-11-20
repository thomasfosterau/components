import { createRawSnippet } from 'svelte';
import { afterEach, expect, test } from 'vite-plus/test';
import type { Locator } from 'vite-plus/test/browser';
import { render, type RenderResult } from 'vitest-browser-svelte';
import Image from '../../src/lib/media/Image.svelte';
import { rgbaToDataUrl } from '../../src/lib/media/thumbhash.ts';
import ImagePhaseFixture from './fixtures/ImagePhaseFixture.svelte';

test('renders a plain src with sizes and lazy loading by default', async () => {
  const screen = await render(Image, {
    src: 'https://example.com/photo.jpg',
    alt: 'A garden bed',
    width: 640,
    height: 360,
  });

  const img = screen.getByRole('img', { name: 'A garden bed' });
  await expect.element(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
  await expect.element(img).toHaveAttribute('sizes', '100vw');
  await expect.element(img).toHaveAttribute('loading', 'lazy');
  await expect.element(img).toHaveAttribute('decoding', 'async');
  await expect.element(img).not.toHaveAttribute('srcset');
});

test('builds a bucketed srcset from id/base/widths', async () => {
  const screen = await render(Image, {
    id: 'abc123',
    alt: 'A tomato seedling',
    widths: [320, 640, 960],
  });

  const img = screen.getByRole('img', { name: 'A tomato seedling' });
  await expect
    .element(img)
    .toHaveAttribute(
      'srcset',
      '/images/abc123?w=320 320w, /images/abc123?w=640 640w, /images/abc123?w=960 960w',
    );
  await expect.element(img).toHaveAttribute('src', '/images/abc123?w=960');
});

test('respects a custom base', async () => {
  const screen = await render(Image, {
    id: 'abc123',
    alt: 'A custom base image',
    base: '/cdn/img',
    widths: [400],
  });

  const img = screen.getByRole('img', { name: 'A custom base image' });
  await expect.element(img).toHaveAttribute('src', '/cdn/img/abc123?w=400');
  await expect.element(img).toHaveAttribute('srcset', '/cdn/img/abc123?w=400 400w');
});

test('eager sets loading=eager and fetchpriority=high', async () => {
  const screen = await render(Image, {
    src: 'https://example.com/hero.jpg',
    alt: 'Hero image',
    eager: true,
  });

  const img = screen.getByRole('img', { name: 'Hero image' });
  await expect.element(img).toHaveAttribute('loading', 'eager');
  await expect.element(img).toHaveAttribute('fetchpriority', 'high');
});

test('wraps in <picture> with <source> elements when sources is given', async () => {
  const screen = await render(Image, {
    src: 'https://example.com/photo.jpg',
    alt: 'A picture-wrapped image',
    sources: [
      { srcset: 'https://example.com/photo.avif', type: 'image/avif' },
      { srcset: 'https://example.com/photo.webp', type: 'image/webp' },
    ],
  });

  const picture = screen.container.querySelector('picture');
  expect(picture).not.toBeNull();
  const sources = picture?.querySelectorAll('source') ?? [];
  expect(sources).toHaveLength(2);
  expect(sources[0]?.getAttribute('srcset')).toBe('https://example.com/photo.avif');
  expect(sources[0]?.getAttribute('type')).toBe('image/avif');
  expect(sources[1]?.getAttribute('type')).toBe('image/webp');
  expect(picture?.querySelector('img')?.getAttribute('src')).toBe('https://example.com/photo.jpg');
});

test('renders no <picture> when sources is absent', async () => {
  const screen = await render(Image, {
    src: 'https://example.com/photo.jpg',
    alt: 'Not picture-wrapped',
  });

  expect(screen.container.querySelector('picture')).toBeNull();
});

test('a decorative image accepts an explicit empty alt', async () => {
  const screen = await render(Image, {
    src: 'https://example.com/deco.jpg',
    alt: '',
  });

  const img = screen.container.querySelector('img');
  expect(img?.getAttribute('alt')).toBe('');
});

// A distinct image per test: one already in the memory cache loads at once, lazy or not.
const pixel = (seed: number): string =>
  rgbaToDataUrl({ w: 2, h: 1, rgba: new Uint8Array([seed, 120, 40, 255, 30, 120, 220, 255]) });
const missing = '/__missing-image__.png';

// The lazy-loading tests scroll their image into view; start each test at the top.
afterEach(() => {
  window.scrollTo(0, 0);
});

const styleOf = (locator: Locator): CSSStyleDeclaration => {
  const element = locator.element();
  if (!(element instanceof HTMLElement)) throw new Error('expected an HTML element');
  return element.style;
};

const phaseOf = (screen: RenderResult<typeof ImagePhaseFixture>) => screen.getByTestId('phase');

test('a lazy image not yet loaded paints its placeholder on the img itself, then drops it once loaded', async () => {
  const screen = await render(ImagePhaseFixture, {
    src: pixel(1),
    alt: 'A garden bed',
    width: 200,
    height: 100,
    placeholder: { kind: 'color', value: '#a3b18a' },
    style: 'margin-top: 4000px',
  });

  const img = screen.getByRole('img', { name: 'A garden bed' });
  await expect.element(phaseOf(screen)).toHaveTextContent('loading');
  expect(styleOf(img).backgroundColor).toBe('rgb(163, 177, 138)');
  // The placeholder is CSS: the img is the only element Image renders.
  expect(screen.container.querySelectorAll('img, span, picture')).toHaveLength(1);

  img.element().scrollIntoView();
  await expect.element(phaseOf(screen)).toHaveTextContent('loaded');
  expect(styleOf(img).backgroundColor).toBe('');
});

test('a skeleton placeholder is the daisyUI class while loading', async () => {
  const screen = await render(Image, {
    src: pixel(2),
    alt: 'Skeleton',
    placeholder: 'skeleton',
    style: 'margin-top: 4000px',
  });

  await expect.element(screen.getByRole('img', { name: 'Skeleton' })).toHaveClass('skeleton');
});

test('without a placeholder the image fades in, and only when motion is allowed', async () => {
  const screen = await render(ImagePhaseFixture, {
    src: pixel(3),
    alt: 'Fades',
    style: 'margin-top: 4000px',
  });

  const img = screen.getByRole('img', { name: 'Fades' });
  await expect.element(img).toHaveClass('opacity-0');
  await expect.element(img).toHaveClass('motion-safe:transition-opacity');
  expect(img.element().className).not.toMatch(/(^|\s)transition-opacity/);

  img.element().scrollIntoView();
  await expect.element(phaseOf(screen)).toHaveTextContent('loaded');
  await expect.element(img).not.toHaveClass('opacity-0');
});

test('fade={false} never hides the image', async () => {
  const screen = await render(Image, {
    src: pixel(4),
    alt: 'No fade',
    fade: false,
    style: 'margin-top: 4000px',
  });

  await expect.element(screen.getByRole('img', { name: 'No fade' })).not.toHaveClass('opacity-0');
});

test('a failed image shows its alt text and the error label in a box reserving the same size', async () => {
  const screen = await render(ImagePhaseFixture, {
    src: missing,
    alt: 'North bed in June',
    width: 200,
    height: 100,
  });

  await expect.element(phaseOf(screen)).toHaveTextContent('error');
  await expect.element(screen.getByText('North bed in June')).toBeVisible();
  await expect.element(screen.getByText('Image could not be loaded')).toBeVisible();
  expect(screen.container.querySelector('img')).toBeNull();
  expect(screen.getByRole('button').elements()).toHaveLength(0);

  // Tests load no CSS, so the reserved box is read from its inline style.
  const box = screen.container.querySelector<HTMLElement>('[data-image-fallback]');
  expect(box?.style.width).toBe('200px');
  expect(box?.style.aspectRatio).toBe('200 / 100');
});

test('Retry re-requests a same-origin image with a cache-busting query', async () => {
  const screen = await render(ImagePhaseFixture, {
    src: missing,
    alt: 'Retry me',
    retryable: true,
    retryLabel: 'Try again',
    eager: true,
  });

  await expect.element(phaseOf(screen)).toHaveTextContent('error');
  await screen.getByRole('button', { name: 'Try again' }).click();

  await expect.element(phaseOf(screen)).toHaveTextContent('error');
  const requests = performance
    .getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((name) => name.includes('__missing-image__.png?retry=1'));
  expect(requests.length).toBeGreaterThan(0);
});

test('a custom fallback receives retry', async () => {
  const fallback = createRawSnippet((args: () => { retry: () => void }) => ({
    render: () => '<button type="button">Reload photo</button>',
    setup: (node: Element) => {
      node.addEventListener('click', () => args().retry());
    },
  }));
  const screen = await render(ImagePhaseFixture, {
    src: missing,
    alt: 'Custom',
    fallback,
    eager: true,
  });

  await screen.getByRole('button', { name: 'Reload photo' }).click();
  await expect.element(phaseOf(screen)).toHaveTextContent('error');
  expect(
    performance.getEntriesByType('resource').some((entry) => entry.name.includes('retry=1')),
  ).toBe(true);
});

test('a decorative image that fails leaves a hidden box with no text', async () => {
  const screen = await render(Image, { src: missing, alt: '', retryable: true, eager: true });

  await expect.poll(() => screen.container.querySelector('[data-image-fallback]')).not.toBeNull();
  const box = screen.container.querySelector('[data-image-fallback]');
  expect(box?.getAttribute('aria-hidden')).toBe('true');
  expect(box?.textContent?.trim() ?? '').toBe('');
});
