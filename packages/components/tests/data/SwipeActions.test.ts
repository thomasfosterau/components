/**
 * `SwipeActions` must never hide an action behind the gesture alone: the
 * "More actions" menu holds every action, revealed buttons are `inert` until
 * their side is open, and a vertical drag reveals nothing.
 */

import { flushSync } from 'svelte';
import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { SwipeAction } from '../../src/lib/data/swipe-actions.svelte.ts';
import SwipeActionsFixture from './fixtures/SwipeActionsFixture.svelte';

function actions(): {
  leading: SwipeAction[];
  trailing: SwipeAction[];
  spies: Record<string, ReturnType<typeof vi.fn<() => void>>>;
} {
  const spies = {
    Pin: vi.fn<() => void>(),
    Archive: vi.fn<() => void>(),
    Delete: vi.fn<() => void>(),
  };
  return {
    spies,
    leading: [{ label: 'Pin', onAction: spies.Pin }],
    trailing: [
      { label: 'Delete', onAction: spies.Delete, destructive: true },
      { label: 'Archive', onAction: spies.Archive },
    ],
  };
}

/** Swipes a touch pointer by `dx`, `dy` in 10 px steps. */
function swipe(target: Element, dx: number, dy = 0): void {
  const init = { bubbles: true, pointerId: 5, pointerType: 'touch' };
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) / 10;
  target.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientX: 200, clientY: 20 }));
  for (let step = 1; step <= steps; step++) {
    const at = { clientX: 200 + (dx * step) / steps, clientY: 20 + (dy * step) / steps };
    target.dispatchEvent(new PointerEvent('pointermove', { ...init, ...at }));
  }
  target.dispatchEvent(
    new PointerEvent('pointerup', { ...init, clientX: 200 + dx, clientY: 20 + dy }),
  );
  flushSync();
}

/** Whether the row's revealed `label` button is reachable (present and not `inert`). */
function revealed(row: Element, label: string): boolean {
  const button = [...row.querySelectorAll('button')].find(
    (candidate) => candidate.textContent?.trim() === label,
  );
  if (button === undefined) throw new Error(`no ${label} button`);
  return button.closest('[inert]') === null;
}

test('the menu lists every action, destructive last, and runs the one chosen', async () => {
  const { leading, trailing, spies } = actions();
  const screen = await render(SwipeActionsFixture, {
    rows: [{ name: 'Bed 4', leading, trailing }],
  });

  await userEvent.click(screen.getByRole('button', { name: 'More actions for Bed 4' }));
  const items = screen
    .getByRole('menuitem')
    .elements()
    .map((item) => item.textContent?.trim());
  expect(items).toEqual(['Pin', 'Archive', 'Delete']);

  await userEvent.click(screen.getByRole('menuitem', { name: 'Archive' }));
  expect(spies.Archive).toHaveBeenCalledTimes(1);
});

test('closed, the revealed buttons are inert and out of the accessibility tree', async () => {
  const { leading, trailing } = actions();
  const screen = await render(SwipeActionsFixture, {
    rows: [{ name: 'Bed 4', leading, trailing }],
  });

  const row = screen.getByTestId('Bed 4').element();
  expect(revealed(row, 'Delete')).toBe(false);
  expect(revealed(row, 'Pin')).toBe(false);
});

test('a swipe toward the start reveals the trailing actions, and a swipe back hides them', async () => {
  const { leading, trailing } = actions();
  const screen = await render(SwipeActionsFixture, {
    rows: [{ name: 'Bed 4', leading, trailing }],
  });
  const row = screen.getByTestId('Bed 4').element();

  swipe(row, -150);
  expect(revealed(row, 'Delete')).toBe(true);
  expect(revealed(row, 'Pin')).toBe(false);

  swipe(row, 150);
  expect(revealed(row, 'Delete')).toBe(false);
});

test('a full swipe runs the first action of that side once', async () => {
  const { leading, trailing, spies } = actions();
  const screen = await render(SwipeActionsFixture, {
    rows: [{ name: 'Bed 4', leading, trailing, fullSwipe: true }],
  });

  swipe(screen.getByTestId('Bed 4').element(), -300);

  expect(spies.Delete).toHaveBeenCalledTimes(1);
  expect(spies.Archive).not.toHaveBeenCalled();
});

test('a vertical drag reveals nothing', async () => {
  const { leading, trailing } = actions();
  const screen = await render(SwipeActionsFixture, {
    rows: [{ name: 'Bed 4', leading, trailing }],
  });

  const row = screen.getByTestId('Bed 4').element();
  swipe(row, -30, 120);

  expect(revealed(row, 'Delete')).toBe(false);
});

test('opening one row of a group closes the other', async () => {
  const { leading, trailing } = actions();
  const screen = await render(SwipeActionsFixture, {
    rows: [
      { name: 'Bed 4', leading, trailing },
      { name: 'Bed 5', leading, trailing },
    ],
  });

  swipe(screen.getByTestId('Bed 4').element(), -150);
  swipe(screen.getByTestId('Bed 5').element(), -150);

  expect(revealed(screen.getByTestId('Bed 4').element(), 'Delete')).toBe(false);
  expect(revealed(screen.getByTestId('Bed 5').element(), 'Delete')).toBe(true);
});

test('Escape closes an open row', async () => {
  const { leading, trailing } = actions();
  const screen = await render(SwipeActionsFixture, {
    rows: [{ name: 'Bed 4', leading, trailing }],
  });
  const row = screen.getByTestId('Bed 4').element();

  swipe(row, 150);
  expect(revealed(row, 'Pin')).toBe(true);
  row.querySelector<HTMLButtonElement>('button')?.focus();
  await userEvent.keyboard('{Escape}');

  await expect.poll(() => revealed(row, 'Pin')).toBe(false);
});
