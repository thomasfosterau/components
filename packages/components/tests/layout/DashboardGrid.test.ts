/**
 * `DashboardGrid`: DOM order follows the layout, edit mode's handle moves
 * by keyboard and pointer with narration, the tile menu resizes, reorders
 * and removes, Add widget and Reset work, and a narrow grid stacks in order.
 */

import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { TileLayout } from '../../src/lib/layout/dashboard.ts';
import DashboardGridFixture from './fixtures/DashboardGridFixture.svelte';

const start: TileLayout[] = [
  { id: 'soil', x: 0, y: 1, w: 1, h: 1 },
  { id: 'harvest', x: 2, y: 0, w: 1, h: 1 },
  { id: 'frost', x: 1, y: 0, w: 1, h: 1 },
  { id: 'rainfall', x: 0, y: 0, w: 1, h: 1 },
];

const announced = (): string =>
  document.querySelector('[aria-live="polite"]')?.textContent?.trim() ?? '';

const headings = (): string[] =>
  Array.from(document.querySelectorAll('h2'), (heading) => heading.textContent.trim());

const focus = (element: Element): void => {
  if (element instanceof HTMLElement) element.focus();
};

const placeOf = (layout: readonly TileLayout[] | undefined, id: string) => {
  const tile = layout?.find((each) => each.id === id);
  return tile === undefined ? undefined : { x: tile.x, y: tile.y, w: tile.w, h: tile.h };
};

const lastLayout = (spy: ReturnType<typeof vi.fn<(layout: TileLayout[]) => void>>) =>
  spy.mock.lastCall?.[0];

const pointerAt = (x: number, y: number): PointerEventInit => ({
  bubbles: true,
  pointerId: 1,
  button: 0,
  clientX: x,
  clientY: y,
});

test('a region of tiles named by their headings, in reading order', async () => {
  const screen = await render(DashboardGridFixture, { layout: start });

  await expect.element(screen.getByRole('region', { name: 'Dashboard' })).toBeInTheDocument();
  await expect.element(screen.getByRole('region', { name: 'Rainfall' })).toBeInTheDocument();
  expect(headings()).toEqual(['Rainfall', 'Frost', 'Harvest', 'Soil']);
  // Outside edit mode a tile has no controls.
  expect(screen.getByRole('button').elements()).toHaveLength(1);
  await expect
    .element(screen.getByRole('button', { name: 'Edit dashboard' }))
    .toHaveAttribute('aria-pressed', 'false');
});

test('Space picks up, an arrow moves, Space drops; DOM order follows', async () => {
  const onLayoutChange = vi.fn<(layout: TileLayout[]) => void>();
  const screen = await render(DashboardGridFixture, { layout: start, onLayoutChange });

  await screen.getByRole('button', { name: 'Edit dashboard' }).click();
  const handle = screen.getByRole('button', { name: 'Move Rainfall' });
  await expect
    .element(handle)
    .toHaveAccessibleDescription(
      'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.',
    );

  focus(handle.element());
  await userEvent.keyboard(' ');
  await expect.element(handle).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(announced).toBe('Picked up Rainfall at row 1, column 1.');

  await userEvent.keyboard('{ArrowRight}');
  await expect.poll(announced).toBe('Rainfall moved to row 1, column 2.');
  await expect.element(handle).toHaveFocus();
  expect(onLayoutChange).not.toHaveBeenCalled();

  await userEvent.keyboard(' ');
  await expect.poll(announced).toBe('Rainfall dropped at row 1, column 2.');
  expect(onLayoutChange).toHaveBeenCalledOnce();
  const next = lastLayout(onLayoutChange);
  expect(placeOf(next, 'rainfall')).toEqual({ x: 1, y: 0, w: 1, h: 1 });
  expect(placeOf(next, 'frost')).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  await expect.poll(headings).toEqual(['Frost', 'Rainfall', 'Harvest', 'Soil']);
  await expect.element(handle).toHaveFocus();
});

test('Escape puts a held tile back', async () => {
  const onLayoutChange = vi.fn<(layout: TileLayout[]) => void>();
  const screen = await render(DashboardGridFixture, {
    layout: start,
    editing: true,
    onLayoutChange,
  });
  const handle = screen.getByRole('button', { name: 'Move Soil' });

  focus(handle.element());
  await userEvent.keyboard(' ');
  await userEvent.keyboard('{ArrowUp}');
  await expect.poll(headings).toEqual(['Soil', 'Frost', 'Harvest', 'Rainfall']);
  await userEvent.keyboard('{Escape}');

  await expect.poll(announced).toBe('Move cancelled. Soil returned to row 2, column 1.');
  expect(onLayoutChange).not.toHaveBeenCalled();
  expect(headings()).toEqual(['Rainfall', 'Frost', 'Harvest', 'Soil']);
});

test('dragging a handle onto another tile swaps them', async () => {
  const onLayoutChange = vi.fn<(layout: TileLayout[]) => void>();
  const screen = await render(DashboardGridFixture, {
    layout: start,
    editing: true,
    onLayoutChange,
  });
  const handle = screen.getByRole('button', { name: 'Move Rainfall' }).element();
  const from = screen.getByRole('region', { name: 'Rainfall' }).element().getBoundingClientRect();
  const to = screen.getByRole('region', { name: 'Harvest' }).element().getBoundingClientRect();
  const grip = handle.getBoundingClientRect();
  const press = { x: grip.left + 4, y: grip.top + 4 };

  handle.dispatchEvent(new PointerEvent('pointerdown', pointerAt(press.x, press.y)));
  const target = pointerAt(press.x + to.left - from.left, press.y + to.top - from.top);
  handle.dispatchEvent(new PointerEvent('pointermove', target));
  await expect.poll(announced).toBe('Rainfall moved to row 1, column 3.');
  handle.dispatchEvent(new PointerEvent('pointerup', target));

  await expect.poll(() => onLayoutChange.mock.calls.length).toBe(1);
  const next = lastLayout(onLayoutChange);
  expect(placeOf(next, 'rainfall')).toEqual({ x: 2, y: 0, w: 1, h: 1 });
  expect(placeOf(next, 'harvest')).toEqual({ x: 0, y: 0, w: 1, h: 1 });
  await expect.poll(headings).toEqual(['Harvest', 'Frost', 'Rainfall', 'Soil']);
});

test('the tile menu sets a size preset, pushing others down', async () => {
  const onLayoutChange = vi.fn<(layout: TileLayout[]) => void>();
  const screen = await render(DashboardGridFixture, {
    layout: start,
    editing: true,
    onLayoutChange,
  });

  await screen.getByRole('button', { name: 'Frost options' }).click();
  await expect.element(page.getByRole('menuitemradio', { name: 'Small' })).toBeChecked();
  // Frost offers only its own sizes.
  expect(page.getByRole('menuitemradio').elements()).toHaveLength(2);
  await page.getByRole('menuitemradio', { name: 'Wide' }).click();

  await expect.poll(announced).toBe('Frost is now Wide.');
  const next = lastLayout(onLayoutChange);
  // Wide is four columns, clamped to the grid's three.
  expect(placeOf(next, 'frost')).toEqual({ x: 0, y: 0, w: 3, h: 1 });
  expect(headings()[0]).toBe('Frost');
});

test('the tile menu moves in reading order and returns focus to the trigger', async () => {
  const screen = await render(DashboardGridFixture, { layout: start, editing: true });

  await expect
    .element(screen.getByRole('button', { name: 'Rainfall options' }))
    .toBeInTheDocument();
  await screen.getByRole('button', { name: 'Rainfall options' }).click();
  await expect
    .element(page.getByRole('menuitem', { name: 'Move up' }))
    .toHaveAttribute('aria-disabled', 'true');
  await page.getByRole('menuitem', { name: 'Move to end' }).click();

  await expect.poll(headings).toEqual(['Frost', 'Harvest', 'Soil', 'Rainfall']);
  await expect.poll(announced).toBe('Rainfall moved to position 4 of 4.');
  await expect.element(screen.getByRole('button', { name: 'Rainfall options' })).toHaveFocus();
});

test('Remove hides a tile and Add widget brings it back', async () => {
  const screen = await render(DashboardGridFixture, { layout: start, editing: true });
  const add = screen.getByRole('button', { name: 'Add widget' });
  await expect.element(add).toBeDisabled();

  await screen.getByRole('button', { name: 'Frost options' }).click();
  await page.getByRole('menuitem', { name: 'Remove from dashboard' }).click();

  await expect.poll(headings).toEqual(['Rainfall', 'Harvest', 'Soil']);
  await expect.poll(announced).toBe('Frost removed from the dashboard.');
  await expect.element(add).toBeEnabled();
  await expect.element(add).toHaveFocus();

  await add.click();
  await page.getByRole('menuitem', { name: 'Frost' }).click();
  await expect.poll(headings).toEqual(['Rainfall', 'Harvest', 'Soil', 'Frost']);
  await expect.poll(announced).toBe('Frost added to the dashboard.');
  await expect.element(screen.getByRole('button', { name: 'Move Frost' })).toHaveFocus();
});

test('Reset asks first, then restores the default layout', async () => {
  const onLayoutChange = vi.fn<(layout: TileLayout[]) => void>();
  const defaults: TileLayout[] = [
    { id: 'soil', x: 0, y: 0, w: 1, h: 1 },
    { id: 'rainfall', x: 1, y: 0, w: 2, h: 1 },
    { id: 'frost', x: 0, y: 1, w: 1, h: 1 },
    { id: 'harvest', x: 1, y: 1, w: 1, h: 1 },
  ];
  const screen = await render(DashboardGridFixture, {
    layout: start,
    editing: true,
    defaultLayout: defaults,
    onLayoutChange,
  });

  await screen.getByRole('button', { name: 'Reset layout' }).click();
  const dialog = page.getByRole('dialog', { name: 'Reset the dashboard layout?' });
  await expect.element(dialog).toBeVisible();
  expect(onLayoutChange).not.toHaveBeenCalled();
  await dialog.getByRole('button', { name: 'Reset' }).click();

  await expect.poll(headings).toEqual(['Soil', 'Rainfall', 'Frost', 'Harvest']);
  expect(lastLayout(onLayoutChange)).toEqual(defaults);
  await expect.poll(announced).toBe('Dashboard layout reset.');
});

test('a narrow grid is one column in reading order, and the handle reorders', async () => {
  await page.viewport(390, 800);
  const onLayoutChange = vi.fn<(layout: TileLayout[]) => void>();
  const screen = await render(DashboardGridFixture, {
    layout: start,
    columns: { sm: 2, md: 3 },
    editing: true,
    onLayoutChange,
  });
  const grid = screen.getByRole('region', { name: 'Rainfall' }).element().parentElement;

  await expect.poll(() => grid?.style.gridTemplateColumns).toBe('repeat(1, minmax(0px, 1fr))');
  expect(headings()).toEqual(['Rainfall', 'Frost', 'Harvest', 'Soil']);

  const handle = screen.getByRole('button', { name: 'Move Harvest' });
  focus(handle.element());
  await userEvent.keyboard(' ');
  await expect.poll(announced).toBe('Picked up Harvest at position 3 of 4.');
  await userEvent.keyboard('{ArrowUp}');
  await expect.poll(announced).toBe('Harvest moved to position 2 of 4.');
  await userEvent.keyboard(' ');

  await expect.poll(headings).toEqual(['Rainfall', 'Harvest', 'Frost', 'Soil']);
  // The stored layout stays three columns wide.
  const next = lastLayout(onLayoutChange);
  expect(placeOf(next, 'harvest')).toEqual({ x: 1, y: 0, w: 1, h: 1 });
  await page.viewport(414, 896);
});

test('leaving edit mode drops the controls and cancels a held tile', async () => {
  const onLayoutChange = vi.fn<(layout: TileLayout[]) => void>();
  const screen = await render(DashboardGridFixture, {
    layout: start,
    editing: true,
    onLayoutChange,
  });
  const handle = screen.getByRole('button', { name: 'Move Soil' });

  focus(handle.element());
  await userEvent.keyboard(' ');
  await userEvent.keyboard('{ArrowUp}');
  await screen.getByRole('button', { name: 'Edit dashboard' }).click();

  await expect.element(handle).not.toBeInTheDocument();
  expect(onLayoutChange).not.toHaveBeenCalled();
  expect(headings()).toEqual(['Rainfall', 'Frost', 'Harvest', 'Soil']);
});
