/**
 * Browser tests for `StaticMap`.
 *
 * The URL arithmetic is pinned without a browser in `./static-url.test.ts`;
 * what a browser adds is the `<img>` contract — that the alternative text is
 * the caller's word and not a default, that the intrinsic size is on the
 * element so the box is reserved before the raster arrives, and that the 2×
 * candidate is offered rather than fetched.
 *
 * No raster ever loads here (the token is a placeholder), which is the point:
 * everything asserted is true before the network answers.
 *
 * @module tests/StaticMap
 */

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import StaticMap from '../src/lib/StaticMap.svelte';

const props = {
  style: { username: 'mapbox', styleId: 'outdoors-v12' },
  view: {
    kind: 'camera' as const,
    camera: { centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 },
  },
  width: 640,
  height: 360,
  accessToken: 'pk.test',
};

test('the alternative text is the caller’s, and names the map in the accessibility tree', async () => {
  const screen = await render(StaticMap, { ...props, alt: 'The site’s location in Melbourne' });

  await expect
    .element(screen.getByRole('img'))
    .toHaveAccessibleName('The site’s location in Melbourne');
});

test('an empty alt takes the map out of the accessibility tree, deliberately', async () => {
  const screen = await render(StaticMap, { ...props, alt: '' });

  // Decoration beside a written address: the caller asked for this by passing
  // `''`, which is why `alt` is required rather than defaulted.
  expect(screen.getByRole('img').elements()).toHaveLength(0);
});

test('carries the intrinsic size, so the box is reserved before the raster arrives', async () => {
  const screen = await render(StaticMap, { ...props, alt: 'A map' });

  const image = screen.getByRole('img');
  await expect.element(image).toHaveAttribute('width', '640');
  await expect.element(image).toHaveAttribute('height', '360');
  await expect.element(image).toHaveAttribute('loading', 'lazy');
});

test('offers the 2× raster as a candidate rather than a second request', async () => {
  const screen = await render(StaticMap, { ...props, alt: 'A map' });

  const [image] = screen.getByRole('img').elements();
  const srcset = image?.getAttribute('srcset') ?? '';
  expect(srcset).toContain(' 1x, ');
  expect(srcset).toContain('@2x');
  expect(image?.getAttribute('src')).toContain('access_token=pk.test');
});

test('merges the caller’s class last and spreads native attributes', async () => {
  const screen = await render(StaticMap, {
    ...props,
    alt: 'A map',
    class: 'rounded-box',
    id: 'site-map',
    'data-testid': 'map',
  });

  const image = screen.getByTestId('map');
  await expect.element(image).toHaveClass('max-w-full');
  await expect.element(image).toHaveClass('rounded-box');
  await expect.element(image).toHaveAttribute('id', 'site-map');
});
