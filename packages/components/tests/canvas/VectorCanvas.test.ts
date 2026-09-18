/**
 * Browser tests for `VectorCanvas`: the ARIA contract and the pointer
 * plumbing, which is behaviour the pure-function specs beside this one cannot
 * reach.
 *
 * The canvas reports rather than mutates, so the fixture plays the
 * application: it accepts each report and re-renders, and the assertions read
 * the result off the fixture's `data-*` attributes. That is the same contract
 * an application has to honour, so a change that broke it would break these.
 *
 * Every gesture is Chromium's own pointer input at a chosen point (see
 * `./pointer.ts`), not a dispatched event carrying a `clientX` the spec made
 * up: the thing under test is a coordinate conversion, and a synthetic event
 * would agree with whatever the conversion happened to do.
 *
 * @module tests/canvas/VectorCanvas
 */

import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import CanvasFixture from './fixtures/CanvasFixture.svelte';
import { drag, press } from './pointer.ts';

test('names the surface for assistive tech, and the name is a prop', async () => {
  const screen = await render(CanvasFixture);

  await expect
    .element(screen.getByRole('application'))
    .toHaveAccessibleName('Vector editing canvas');
});

test('renders the caller’s element renderer', async () => {
  const screen = await render(CanvasFixture);

  await expect.element(screen.getByTestId('shape-one')).toHaveAttribute('x', '20');
});

test('reports a gesture in canvas coordinates, from press to release', async () => {
  const screen = await render(CanvasFixture);

  await drag(screen.getByRole('application'), { x: 40, y: 30 }, { x: 60, y: 50 });

  // Playwright emits at least one intermediate move; the claim is the two ends.
  const gestures = (await screen.getByTestId('canvas-state').element()).getAttribute(
    'data-gestures',
  );
  expect(gestures?.startsWith('down:40,30|move:60,50')).toBe(true);
  expect(gestures?.endsWith('|up:60,50')).toBe(true);
});

test('snaps reported points to the grid when the document says so', async () => {
  const screen = await render(CanvasFixture, { snap: true });

  await press(screen.getByRole('application'), { x: 27, y: 33 });

  await expect
    .element(screen.getByTestId('canvas-state'))
    .toHaveAttribute('data-gestures', 'down:30,30|up:30,30');
});

test('reports nothing for a pointer that is merely passing over', async () => {
  const screen = await render(CanvasFixture);

  await userEvent.hover(screen.getByRole('application'));

  await expect.element(screen.getByTestId('canvas-state')).toHaveAttribute('data-gestures', '');
});

test('accepts no input at all when it is not interactive', async () => {
  const screen = await render(CanvasFixture, { interactive: false });
  const surface = screen.getByRole('application');

  await press(surface, { x: 10, y: 10 });
  await surface.wheel({ delta: { y: -100 } });

  const state = screen.getByTestId('canvas-state');
  await expect.element(state).toHaveAttribute('data-gestures', '');
  await expect.element(state).toHaveAttribute('data-zoom', '1');
});

test('pans with the pan tool rather than reporting a gesture', async () => {
  const screen = await render(CanvasFixture, { tool: 'pan' });

  await drag(screen.getByRole('application'), { x: 10, y: 10 }, { x: 30, y: 25 });

  const state = screen.getByTestId('canvas-state');
  await expect.element(state).toHaveAttribute('data-gestures', '');
  await expect.element(state).toHaveAttribute('data-offset-x', '20');
  await expect.element(state).toHaveAttribute('data-offset-y', '15');
});

test('zooms on the wheel, in both directions', async () => {
  const screen = await render(CanvasFixture);
  const surface = screen.getByRole('application');
  const zoom = async (): Promise<number> =>
    Number((await screen.getByTestId('canvas-state').element()).getAttribute('data-zoom'));

  await surface.wheel({ delta: { y: -100 } });
  expect(await zoom()).toBeCloseTo(1.1);

  await surface.wheel({ delta: { y: 100 } });
  expect(await zoom()).toBeCloseTo(0.99);
});
