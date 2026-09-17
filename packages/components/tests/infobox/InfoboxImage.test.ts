import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import InfoboxImage from '../../src/lib/infobox/InfoboxImage.svelte';

test('reserves the box before the bytes arrive and lazy-loads by default', async () => {
  const screen = await render(InfoboxImage, {
    src: '/leaf.svg',
    alt: 'A leaf',
    width: 320,
    height: 200,
  });

  const image = screen.getByRole('img', { name: 'A leaf' });
  await expect.element(image).toHaveAttribute('width', '320');
  await expect.element(image).toHaveAttribute('height', '200');
  await expect.element(image).toHaveAttribute('loading', 'lazy');
  await expect.element(image).not.toHaveAttribute('fetchpriority');
});

test('renders a caption as a figcaption when there is one', async () => {
  const screen = await render(InfoboxImage, {
    src: '/leaf.svg',
    alt: '',
    caption: 'Abaxial surface',
  });

  await expect.element(screen.getByText('Abaxial surface')).toBeInTheDocument();
  const figcaption = screen.container.querySelector('figcaption');
  expect(figcaption).not.toBeNull();
});

test('renders no figcaption when caption is absent', async () => {
  const screen = await render(InfoboxImage, { src: '/leaf.svg', alt: 'A leaf' });

  expect(screen.container.querySelector('figcaption')).toBeNull();
});

test('eager sets loading="eager" and fetchpriority="high" together', async () => {
  const screen = await render(InfoboxImage, {
    src: '/hero.jpg',
    alt: 'The identifying image',
    eager: true,
  });

  const image = screen.getByRole('img', { name: 'The identifying image' });
  await expect.element(image).toHaveAttribute('loading', 'eager');
  await expect.element(image).toHaveAttribute('fetchpriority', 'high');
});
