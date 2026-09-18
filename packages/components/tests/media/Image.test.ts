import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Image from '../../src/lib/media/Image.svelte';

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
