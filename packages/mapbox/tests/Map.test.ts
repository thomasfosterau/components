/**
 * Browser tests for `Map`, the pair's switch.
 *
 * The claim worth pinning is the ORDER: the raster is what the first painted
 * frame carries, on the server and on the client alike, and the live map only
 * replaces it from an effect. A component that reversed those shows a reader
 * nothing until an 800 kB engine has downloaded, parsed and painted.
 *
 * `mapbox-gl` is mocked to fail at construction here, so the upgrade lands on
 * `DynamicMap`'s unavailable state — the observable half of the switch, and
 * the only half that can be asserted without a Mapbox credential and a
 * network. The engine is a REQUIRED peer of this package and is installed, so
 * that state has to be produced at the seam rather than by its absence.
 *
 * The half of the claim this suite CANNOT make is the server half: that the
 * first painted frame is the raster. `hydrated` is flipped from an effect, and
 * an effect has already flushed by the time an awaited `render` resolves, so
 * there is no moment here in which to catch it. What is asserted instead is
 * the observable consequence — that the raster is what `interactive={false}`
 * leaves standing, and that the upgrade replaces it rather than sitting beside
 * it.
 *
 * @module tests/Map
 */

import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Map from '../src/lib/Map.svelte';

// Same seam as tests/DynamicMap.test.ts — see the note there on why the engine
// fails at construction rather than at import.
vi.mock('mapbox-gl', () => ({
  Map: class {
    constructor() {
      throw new Error('mapbox-gl unavailable');
    }
  },
  NavigationControl: class {},
}));

const props = {
  accessToken: 'pk.test',
  style: { username: 'mapbox', styleId: 'outdoors-v12' },
  camera: { centre: { longitude: 144.963, latitude: -37.814 }, zoom: 13 },
  width: 640,
  height: 360,
  alt: 'The site’s location',
};

test('upgrades from the raster once the page has hydrated', async () => {
  const screen = await render(Map, props);

  // With the engine mocked to fail the upgrade lands on the unavailable
  // sentence — but it has still left the raster behind, which is the switch.
  await expect.element(screen.getByText('Map unavailable')).toBeInTheDocument();
  expect(screen.getByRole('img').elements()).toHaveLength(0);
});

test('stays on the raster when it is told not to upgrade', async () => {
  const screen = await render(Map, { ...props, interactive: false });

  await expect.element(screen.getByRole('img')).toHaveAccessibleName('The site’s location');
  expect(screen.getByText('Map unavailable').elements()).toHaveLength(0);
});

test('passes the unavailable sentence through to the live half', async () => {
  const screen = await render(Map, { ...props, unavailableLabel: 'No map here' });

  await expect.element(screen.getByText('No map here')).toBeInTheDocument();
});
