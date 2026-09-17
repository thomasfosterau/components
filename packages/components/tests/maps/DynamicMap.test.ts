/**
 * Browser tests for `DynamicMap` — specifically the branch an application that
 * never installed the optional peer takes.
 *
 * `mapbox-gl` is not installed in this repository, so the dynamic `import()`
 * inside the mount effect rejects (see the `absentOptionalPeers` plugin in the
 * package's `vite.config.ts`, which makes the absence behave like an absence
 * rather than a build failure). That is not a contrivance for the test: it is
 * the state every consumer who renders no interactive map is in, and the state
 * this component exists to survive gracefully.
 *
 * What the live map DOES once Mapbox loads is Mapbox's contract, not this
 * package's, and is not asserted here.
 *
 * @module tests/maps/DynamicMap
 */

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DynamicMap from '../../src/lib/maps/DynamicMap.svelte';

const props = {
  accessToken: 'pk.test',
  style: { username: 'mapbox', styleId: 'outdoors-v12' },
  camera: { centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 },
};

test('says so rather than showing a blank rectangle when the map cannot load', async () => {
  const screen = await render(DynamicMap, props);

  await expect.element(screen.getByText('Map unavailable')).toBeInTheDocument();
  // The application region is gone with it — an unnamed empty box left in the
  // accessibility tree would be worse than nothing.
  expect(screen.getByRole('application').elements()).toHaveLength(0);
});

test('the unavailable sentence is a prop, not a message read from a context', async () => {
  const screen = await render(DynamicMap, {
    ...props,
    unavailableLabel: 'La carte n’a pas pu être chargée.',
  });

  await expect.element(screen.getByText('La carte n’a pas pu être chargée.')).toBeInTheDocument();
});

test('names the map region and its hint from props, before the peer’s absence lands', async () => {
  const screen = await render(DynamicMap, {
    ...props,
    label: 'The site’s location',
    panHintLabel: 'Use two fingers to move the map',
  });

  // Read SYNCHRONOUSLY, with no await between the render and the reads. The
  // live branch is the one an application that HAS the peer stays in; the only
  // window this repository gets on it is the interval before the module fetch
  // that will reject comes back over the network, and an `await` here would
  // hand that interval away. Nothing is asserted about the map itself — what
  // Mapbox draws is Mapbox's contract — only that both names reach the DOM
  // from props rather than from a context.
  const [region] = screen.getByRole('application').elements();
  expect(region?.getAttribute('aria-label')).toBe('The site’s location');
  expect(screen.container.textContent).toContain('Use two fingers to move the map');
});
