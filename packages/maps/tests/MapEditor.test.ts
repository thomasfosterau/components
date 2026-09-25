/**
 * Browser tests for `MapEditor`: which gesture means which edit, and the
 * contract that makes one drag one undo.
 *
 * The geometry itself is pinned without a browser in `./shapes.test.ts`; what
 * is here is the wiring, which only a real pointer can exercise. Every gesture
 * below is Chromium's own input at a chosen point on the surface (see
 * `../canvas/pointer.ts`), so a mistake in how the editor measures its own
 * surface fails these — which a dispatched event carrying a spec-chosen
 * `clientX` could not.
 *
 * The fixture plays the owning page: it accepts each report, hands back a new
 * document, and keeps the undo stack the editor deliberately does not.
 *
 * @module tests/MapEditor
 */

import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import { altPress, doublePress, drag, press } from './pointer.ts';
import MapEditorFixture from './fixtures/MapEditorFixture.svelte';

/**
 * The fixture's two 40-unit squares sit at (20,20) and (220,20), so `near`'s
 * corners are (20,20) (60,20) (60,60) (20,60) and its edge midpoints are
 * (40,20) (60,40) (40,60) (20,40). Everything past x=100 and y=100 is empty.
 *
 * The two handle targets are aimed a couple of units INSIDE the shape rather
 * than exactly on a corner or an edge. Both are still well within
 * `HANDLE_TOLERANCE`, and the offset buys the one thing an exact corner cannot
 * have: a real pointer lands on a real sub-pixel, so a press aimed at the
 * boundary falls outside the shape about half the time, and `shapeAt`'s box
 * test includes its edges exactly.
 */
const NEAR_CORNER = { x: 58, y: 22 };
const NEAR_MIDPOINT = { x: 40, y: 23 };
const INSIDE_NEAR = { x: 30, y: 30 };
const EMPTY = { x: 150, y: 150 };

/** Just enough of a render result to reach the fixture's published state. */
interface StateReader {
  getByTestId: (id: string) => { element: () => HTMLElement | SVGElement };
}

/**
 * One of the fixture's `data-*` attributes.
 *
 * `async` although the read itself is synchronous: awaiting it yields a
 * microtask, which is where Svelte applies the DOM update an action caused.
 */
const read = async (screen: StateReader, name: string): Promise<string> =>
  screen.getByTestId('editor-state').element().getAttribute(`data-${name}`) ?? '';

/** The `near` shape's outline, which is always the first the fixture publishes. */
const near = async (screen: StateReader): Promise<string> =>
  (await read(screen, 'outlines')).split('|')[0] ?? '';

test('names the editing surface, and the name is a prop', async () => {
  const screen = await render(MapEditorFixture);

  await expect.element(screen.getByRole('application')).toHaveAccessibleName('Plan editor');
});

test('selects the shape under the pointer, and clears the selection off it', async () => {
  const screen = await render(MapEditorFixture);
  const surface = screen.getByRole('application');

  await press(surface, INSIDE_NEAR);
  expect(await read(screen, 'selected')).toBe('near');

  await press(surface, EMPTY);
  expect(await read(screen, 'selected')).toBe('');
});

test('moves the shape it picked up, and only that one', async () => {
  const screen = await render(MapEditorFixture);

  await drag(screen.getByRole('application'), INSIDE_NEAR, { x: 60, y: 50 });

  expect(await read(screen, 'positions')).toBe('near@50,40|far@220,20');
});

test('stops moving once the pointer is up', async () => {
  const screen = await render(MapEditorFixture);
  const surface = screen.getByRole('application');

  await drag(surface, INSIDE_NEAR, { x: 60, y: 50 });
  await userEvent.hover(surface);

  expect(await read(screen, 'positions')).toBe('near@50,40|far@220,20');
});

test('moves nothing when the drag started on empty canvas', async () => {
  const screen = await render(MapEditorFixture);

  await drag(screen.getByRole('application'), EMPTY, { x: 170, y: 170 });

  expect(await read(screen, 'positions')).toBe('near@20,20|far@220,20');
});

test('selects a locked shape but refuses to move it', async () => {
  const screen = await render(MapEditorFixture, { locked: true });

  await drag(screen.getByRole('application'), INSIDE_NEAR, { x: 80, y: 80 });

  expect(await read(screen, 'selected')).toBe('near');
  expect(await read(screen, 'positions')).toBe('near@20,20|far@220,20');
});

test('does not select while the pan tool is in hand', async () => {
  const screen = await render(MapEditorFixture, { tool: 'pan' });

  await press(screen.getByRole('application'), INSIDE_NEAR);

  expect(await read(screen, 'selected')).toBe('');
});

test('drags a vertex rather than the whole shape', async () => {
  const screen = await render(MapEditorFixture, { selection: ['near'] });

  await drag(screen.getByRole('application'), NEAR_CORNER, { x: 80, y: 30 });

  expect(await near(screen)).toBe('near:0,0 62,8 40,40 0,40');
  // The shape itself has not moved; only its corner has.
  expect(await read(screen, 'positions')).toBe('near@20,20|far@220,20');
});

test('only offers handles on a shape that is selected', async () => {
  const screen = await render(MapEditorFixture);

  await drag(screen.getByRole('application'), NEAR_CORNER, { x: 80, y: 30 });

  // The press picked the shape (its box covers its own corner) and dragged the
  // whole thing rather than reshaping it.
  expect(await near(screen)).toBe('near:0,0 40,0 40,40 0,40');
  expect(await read(screen, 'positions')).toBe('near@42,28|far@220,20');
});

test('splits an edge when its midpoint handle is dragged, and the new vertex follows', async () => {
  const screen = await render(MapEditorFixture, { selection: ['near'] });

  await drag(screen.getByRole('application'), NEAR_MIDPOINT, { x: 45, y: 10 });

  expect(await near(screen)).toBe('near:0,0 25,-10 40,0 40,40 0,40');
});

test('removes a vertex on an alt-click, and refuses below three', async () => {
  const screen = await render(MapEditorFixture, { selection: ['near'] });
  const surface = screen.getByRole('application');

  await altPress(surface, NEAR_CORNER);
  expect(await near(screen)).toBe('near:0,0 40,40 0,40');

  await altPress(surface, { x: 20, y: 20 });
  expect(await near(screen)).toBe('near:0,0 40,40 0,40');
});

test('leaves a locked shape’s vertices alone', async () => {
  const screen = await render(MapEditorFixture, { selection: ['near'], locked: true });

  await drag(screen.getByRole('application'), NEAR_CORNER, { x: 80, y: 30 });

  expect(await near(screen)).toBe('near:0,0 40,0 40,40 0,40');
});

test('draws nothing when the page offers no defaults for a new shape', async () => {
  const screen = await render(MapEditorFixture, { tool: 'draw-polygon' });

  await press(screen.getByRole('application'), { x: 20, y: 120 });

  expect(await read(screen, 'kinds')).toBe('near:polygon|far:polygon');
});

test('places a vertex per press and finishes on a double-click, with no doubled corner', async () => {
  const screen = await render(MapEditorFixture, { tool: 'draw-polygon', drawable: true });
  const surface = screen.getByRole('application');

  await press(surface, { x: 20, y: 120 });
  await press(surface, { x: 70, y: 120 });
  await press(surface, { x: 70, y: 170 });
  // A real double-click is two clicks: the first places the fourth corner, the
  // second carries `detail > 1` and finishes. The corner is placed ONCE — the
  // duplicate this guards against is what a naive reading of `detail` produces.
  await doublePress(surface, { x: 20, y: 170 });

  expect(await read(screen, 'kinds')).toBe('near:polygon|far:polygon|drawn-1:polygon');
  expect((await read(screen, 'outlines')).split('|')[2]).toBe('drawn-1:0,0 50,0 50,50 0,50');
});

test('closes an outline by pressing its first vertex again', async () => {
  const screen = await render(MapEditorFixture, { tool: 'draw-line', drawable: true });
  const surface = screen.getByRole('application');

  await press(surface, { x: 20, y: 120 });
  await press(surface, { x: 70, y: 120 });
  await press(surface, { x: 20, y: 120 });

  expect(await read(screen, 'kinds')).toBe('near:polygon|far:polygon|drawn-1:line');
  expect((await read(screen, 'outlines')).split('|')[2]).toBe('drawn-1:0,0 50,0');
});

test('discards an outline too short to be one rather than leaving a stub in the plan', async () => {
  const screen = await render(MapEditorFixture, { tool: 'draw-polygon', drawable: true });
  const surface = screen.getByRole('application');

  await press(surface, { x: 20, y: 120 });
  // Two corners and a finish: not a polygon, so it goes.
  await doublePress(surface, { x: 70, y: 120 });

  expect(await read(screen, 'kinds')).toBe('near:polygon|far:polygon');
});

test('records one history entry per drag, however many moves it took', async () => {
  const screen = await render(MapEditorFixture);

  await drag(screen.getByRole('application'), INSIDE_NEAR, { x: 60, y: 50 });

  expect(await read(screen, 'history')).toBe('1/0');
  expect(await read(screen, 'positions')).toBe('near@50,40|far@220,20');
});

test('records nothing for a press that never moved anything', async () => {
  const screen = await render(MapEditorFixture);

  await press(screen.getByRole('application'), INSIDE_NEAR);

  expect(await read(screen, 'history')).toBe('0/0');
});

test('walks a drag back and forward again', async () => {
  const screen = await render(MapEditorFixture);

  await drag(screen.getByRole('application'), INSIDE_NEAR, { x: 60, y: 50 });

  await screen.getByRole('button', { name: 'Undo' }).click();
  expect(await read(screen, 'positions')).toBe('near@20,20|far@220,20');
  expect(await read(screen, 'history')).toBe('0/1');

  await screen.getByRole('button', { name: 'Redo' }).click();
  expect(await read(screen, 'positions')).toBe('near@50,40|far@220,20');
  expect(await read(screen, 'history')).toBe('1/0');
});

test('takes an inserted vertex and its drag back as ONE step', async () => {
  const screen = await render(MapEditorFixture, { selection: ['near'] });

  await drag(screen.getByRole('application'), NEAR_MIDPOINT, { x: 45, y: 10 });
  expect(await read(screen, 'history')).toBe('1/0');

  await screen.getByRole('button', { name: 'Undo' }).click();
  expect(await near(screen)).toBe('near:0,0 40,0 40,40 0,40');
});

test('takes a drawn shape back a vertex at a time', async () => {
  const screen = await render(MapEditorFixture, { tool: 'draw-polygon', drawable: true });
  const surface = screen.getByRole('application');
  const undo = screen.getByRole('button', { name: 'Undo' });

  await press(surface, { x: 20, y: 120 });
  await press(surface, { x: 70, y: 120 });
  await press(surface, { x: 70, y: 170 });
  expect(await read(screen, 'entries')).toBe('add,update,update');

  await undo.click();
  expect((await read(screen, 'outlines')).split('|')[2]).toBe('drawn-1:0,0 50,0');
  await undo.click();
  await undo.click();
  expect(await read(screen, 'kinds')).toBe('near:polygon|far:polygon');
});

test('drops the futures once the document has diverged from them', async () => {
  const screen = await render(MapEditorFixture);
  const surface = screen.getByRole('application');

  await drag(surface, INSIDE_NEAR, { x: 60, y: 50 });
  await screen.getByRole('button', { name: 'Undo' }).click();
  expect(await read(screen, 'history')).toBe('0/1');

  await drag(surface, INSIDE_NEAR, { x: 50, y: 40 });
  expect(await read(screen, 'history')).toBe('1/0');
});
