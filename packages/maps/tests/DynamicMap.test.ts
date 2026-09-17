/**
 * Browser tests for `DynamicMap` — specifically the branch an application
 * whose Mapbox GL cannot load takes.
 *
 * `mapbox-gl` is a REQUIRED peer of this package and IS installed here, so the
 * absence that used to produce this branch for free is gone. It is produced
 * deliberately instead: `vi.mock` stands a `Map` in that throws when it is
 * constructed, which is the WebGL-unavailable case, and which lands on the
 * same `catch` a missing engine or a 404'd bundle does. Mocking at that seam
 * keeps the assertion about THIS component's behaviour rather than about the
 * workspace's install graph.
 *
 * What the live map DOES once Mapbox loads is Mapbox's contract, not this
 * package's, and is not asserted here.
 *
 * @module tests/DynamicMap
 */

import { expect, test, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import DynamicMap from '../src/lib/DynamicMap.svelte';

vi.mock('mapbox-gl', () => ({
  // A constructor that throws is the WebGL-unavailable case exactly: the
  // engine's module loads, `new mapbox.Map(...)` does not survive it, and
  // `DynamicMap`'s try/catch is what the reader ends up on. (A factory that
  // throws outright — modelling the module itself being absent — is NOT usable
  // here: Vitest's browser mocker surfaces that as an unhandled rejection in
  // the runner rather than as a rejected `import()` inside the component.)
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
  // live branch is the one an application whose engine loads stays in; the only
  // window this suite gets on it is the interval before the failing
  // construction settles, and an `await` here would hand that interval away. Nothing is asserted about the map itself — what
  // Mapbox draws is Mapbox's contract — only that both names reach the DOM
  // from props rather than from a context.
  const [region] = screen.getByRole('application').elements();
  expect(region?.getAttribute('aria-label')).toBe('The site’s location');
  expect(screen.container.textContent).toContain('Use two fingers to move the map');
});
