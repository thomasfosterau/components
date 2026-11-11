/**
 * `SortableList`'s three equivalent ways to reorder — keyboard pick-up and
 * move, the move menu, and a pointer drag of the handle — and the live-region
 * announcements and focus behaviour that make the first two usable without
 * sight of the list.
 */

import { expect, test, vi } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import SortableListFixture from './fixtures/SortableListFixture.svelte';

const announced = (): string =>
  document.querySelector('[aria-live="polite"]')?.textContent?.trim() ?? '';

const order = (): string => document.querySelector('[data-testid="order"]')?.textContent ?? '';

const focus = (element: Element): void => {
  if (element instanceof HTMLElement) element.focus();
};

test('each handle is a named button described by the instructions', async () => {
  const screen = await render(SortableListFixture);

  await expect.element(screen.getByRole('list', { name: 'Beds' })).toBeInTheDocument();
  expect(screen.getByRole('listitem').elements()).toHaveLength(6);
  const handle = screen.getByRole('button', { name: 'Reorder Bed 4' });
  await expect.element(handle).toHaveAttribute('aria-pressed', 'false');
  await expect
    .element(handle)
    .toHaveAccessibleDescription(
      'Press Space to pick up. Use the arrow keys to move, Space to drop, Escape to cancel.',
    );
});

test('Space picks up, the arrows move, Space drops — focus stays on the handle', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder });
  const handle = screen.getByRole('button', { name: 'Reorder Bed 2' });

  focus(handle.element());
  await userEvent.keyboard(' ');
  await expect.element(handle).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(announced).toBe('Picked up Bed 2. Position 2 of 6.');

  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{ArrowDown}');
  await expect.poll(announced).toBe('Bed 2 moved to position 4 of 6.');
  await expect.element(handle).toHaveFocus();
  // Nothing is committed while the item is held.
  expect(onReorder).not.toHaveBeenCalled();
  expect(order()).toBe('Bed 1, Bed 2, Bed 3, Bed 4, Bed 5, Bed 6');

  await userEvent.keyboard(' ');
  expect(onReorder).toHaveBeenCalledExactlyOnceWith(1, 3);
  await expect.poll(order).toBe('Bed 1, Bed 3, Bed 4, Bed 2, Bed 5, Bed 6');
  await expect.poll(announced).toBe('Bed 2 dropped at position 4 of 6.');
  await expect.element(handle).toHaveAttribute('aria-pressed', 'false');
  await expect.element(handle).toHaveFocus();
});

test('Home and End move a held item to either end; Enter drops it', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder });

  focus(screen.getByRole('button', { name: 'Reorder Bed 3' }).element());
  await userEvent.keyboard('{Enter}');
  await userEvent.keyboard('{End}');
  await expect.poll(announced).toBe('Bed 3 moved to position 6 of 6.');
  await userEvent.keyboard('{Home}');
  await expect.poll(announced).toBe('Bed 3 moved to position 1 of 6.');
  await userEvent.keyboard('{Enter}');

  expect(onReorder).toHaveBeenCalledExactlyOnceWith(2, 0);
  await expect.poll(order).toBe('Bed 3, Bed 1, Bed 2, Bed 4, Bed 5, Bed 6');
});

test('Escape restores the original order, announces it and commits nothing', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder });
  const handle = screen.getByRole('button', { name: 'Reorder Bed 2' });

  focus(handle.element());
  await userEvent.keyboard(' ');
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Escape}');

  await expect.poll(announced).toBe('Reorder cancelled. Bed 2 returned to position 2.');
  expect(onReorder).not.toHaveBeenCalled();
  const names = screen
    .getByRole('listitem')
    .elements()
    .map((row) => row.textContent);
  expect(names[1]).toContain('Bed 2');
  await expect.element(handle).toHaveAttribute('aria-pressed', 'false');
  await expect.element(handle).toHaveFocus();
});

test('a horizontal list moves with the left and right arrows', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder, orientation: 'horizontal' });

  focus(screen.getByRole('button', { name: 'Reorder Bed 1' }).element());
  await userEvent.keyboard(' ');
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{ArrowRight}');
  await userEvent.keyboard(' ');

  expect(onReorder).toHaveBeenCalledExactlyOnceWith(0, 1);
});

test('the move menu moves a row to the top, and disables what cannot apply', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder });

  await screen.getByRole('button', { name: 'Move Bed 4' }).click();
  await page.getByRole('menuitem', { name: 'Move to top' }).click();

  expect(onReorder).toHaveBeenCalledExactlyOnceWith(3, 0);
  await expect.poll(order).toBe('Bed 4, Bed 1, Bed 2, Bed 3, Bed 5, Bed 6');
  await expect.poll(announced).toBe('Bed 4 moved to position 1 of 6.');
  await expect.element(screen.getByRole('button', { name: 'Move Bed 4' })).toHaveFocus();

  await userEvent.keyboard('{Escape}');
  await screen.getByRole('button', { name: 'Move Bed 4' }).click();
  await expect
    .element(page.getByRole('menuitem', { name: 'Move up' }))
    .toHaveAttribute('aria-disabled', 'true');
  await expect
    .element(page.getByRole('menuitem', { name: 'Move down' }))
    .not.toHaveAttribute('aria-disabled', 'true');
});

test('a rejected onReorder undoes the move and says so', async () => {
  const onReorder = vi.fn<(from: number, to: number) => Promise<void>>(() =>
    Promise.reject(new Error('offline')),
  );
  const screen = await render(SortableListFixture, { onReorder });

  await screen.getByRole('button', { name: 'Move Bed 1' }).click();
  await page.getByRole('menuitem', { name: 'Move down' }).click();

  await expect.poll(announced).toBe('Could not move Bed 1. It is back at position 1.');
  expect(order()).toBe('Bed 1, Bed 2, Bed 3, Bed 4, Bed 5, Bed 6');
});

test('dragging the handle of row 1 past row 3 reorders the list', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder });
  const handle = screen.getByRole('button', { name: 'Reorder Bed 1' });
  const target = screen.getByText('Bed 3', { exact: true });

  // Just above the bottom of row 3's text: past its row's centre, short of row 4's.
  await handle.dropTo(target, { sourcePosition: { x: 8, y: 8 }, targetPosition: { x: 8, y: 36 } });

  expect(onReorder).toHaveBeenCalledExactlyOnceWith(0, 2);
  await expect.poll(order).toBe('Bed 2, Bed 3, Bed 1, Bed 4, Bed 5, Bed 6');
  await expect.poll(announced).toBe('Bed 1 dropped at position 3 of 6.');
});

test('dragging a row by its text, not its handle, does nothing', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder });

  await screen
    .getByText('Bed 1', { exact: true })
    .dropTo(screen.getByText('Bed 3', { exact: true }), {
      sourcePosition: { x: 8, y: 20 },
      targetPosition: { x: 8, y: 36 },
    });

  expect(onReorder).not.toHaveBeenCalled();
  expect(order()).toBe('Bed 1, Bed 2, Bed 3, Bed 4, Bed 5, Bed 6');
});

test('without a handle the move menu is the only control', async () => {
  const screen = await render(SortableListFixture, { handle: false });

  expect(screen.getByRole('button', { name: /^Reorder/ }).elements()).toHaveLength(0);
  expect(screen.getByRole('button', { name: /^Move Bed/ }).elements()).toHaveLength(6);
});

test('Escape during a pointer drag cancels it', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder });
  const handle = screen.getByRole('button', { name: 'Reorder Bed 1' }).element();
  const { left, top, bottom } = handle.getBoundingClientRect();
  const at = (y: number): PointerEventInit => ({
    bubbles: true,
    pointerId: 1,
    button: 0,
    clientX: left + 4,
    clientY: y,
  });

  handle.dispatchEvent(new PointerEvent('pointerdown', at(top + 4)));
  handle.dispatchEvent(new PointerEvent('pointermove', at(bottom + 300)));
  await expect.poll(announced).toMatch(/^Bed 1 moved to position/);
  await userEvent.keyboard('{Escape}');
  handle.dispatchEvent(new PointerEvent('pointerup', at(bottom + 300)));

  await expect.poll(announced).toBe('Reorder cancelled. Bed 1 returned to position 1.');
  expect(onReorder).not.toHaveBeenCalled();
  expect(order()).toBe('Bed 1, Bed 2, Bed 3, Bed 4, Bed 5, Bed 6');
});

test('a cancelled pointer (the browser took the gesture) puts the item back', async () => {
  const onReorder = vi.fn<(from: number, to: number) => void>();
  const screen = await render(SortableListFixture, { onReorder });
  const handle = screen.getByRole('button', { name: 'Reorder Bed 2' }).element();
  const { left, top, bottom } = handle.getBoundingClientRect();
  const at = (y: number, pointerId = 7): PointerEventInit => ({
    bubbles: true,
    pointerId,
    button: 0,
    clientX: left + 4,
    clientY: y,
  });

  handle.dispatchEvent(new PointerEvent('pointerdown', at(top + 4)));
  handle.dispatchEvent(new PointerEvent('pointermove', at(bottom + 300)));
  await expect.poll(announced).toMatch(/^Bed 2 moved to position/);
  // Another pointer's cancel is not this drag's.
  handle.dispatchEvent(new PointerEvent('pointercancel', at(bottom + 300, 8)));
  expect(announced()).toMatch(/^Bed 2 moved to position/);
  handle.dispatchEvent(new PointerEvent('pointercancel', at(bottom + 300)));

  await expect.poll(announced).toBe('Reorder cancelled. Bed 2 returned to position 2.');
  expect(onReorder).not.toHaveBeenCalled();
  expect(order()).toBe('Bed 1, Bed 2, Bed 3, Bed 4, Bed 5, Bed 6');
});
