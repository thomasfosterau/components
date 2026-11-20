/**
 * `PullToRefresh` must never depend on the gesture alone: a touch pull from
 * the top refreshes, and so do the Refresh button and an external
 * `refreshing = true`, with the progress announced in a live region.
 */

import { flushSync } from 'svelte';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PullToRefreshFixture from './fixtures/PullToRefreshFixture.svelte';

function scrollerOf(root: Element): HTMLElement {
  const scroller = root.querySelector<HTMLElement>('[aria-busy]:not(button)');
  if (scroller === null) throw new Error('no scroll region');
  return scroller;
}

/** Drags a pointer of `pointerType` down `distance` px on `target`. */
function drag(target: HTMLElement, distance: number, pointerType = 'touch'): void {
  const init = { bubbles: true, pointerId: 7, pointerType, clientX: 50 };
  target.dispatchEvent(new PointerEvent('pointerdown', { ...init, clientY: 10 }));
  for (let y = 10; y <= 10 + distance; y += 10) {
    target.dispatchEvent(new PointerEvent('pointermove', { ...init, clientY: y }));
  }
  target.dispatchEvent(new PointerEvent('pointerup', { ...init, clientY: 10 + distance }));
  flushSync();
}

test('a touch pull past the threshold from the top refreshes once', async () => {
  const onRefresh = vi.fn<(signal: AbortSignal) => Promise<void>>(() => Promise.resolve());
  const screen = await render(PullToRefreshFixture, { onRefresh });

  drag(scrollerOf(screen.getByTestId('ptr').element()), 100);

  expect(onRefresh).toHaveBeenCalledTimes(1);
});

test('a short pull, a mouse drag, or a pull below the top does nothing', async () => {
  const onRefresh = vi.fn<(signal: AbortSignal) => Promise<void>>(() => Promise.resolve());
  const screen = await render(PullToRefreshFixture, { onRefresh });
  const scroller = scrollerOf(screen.getByTestId('ptr').element());

  drag(scroller, 40);
  drag(scroller, 100, 'mouse');
  scroller.scrollTop = 50;
  drag(scroller, 100);

  expect(onRefresh).not.toHaveBeenCalled();
});

test('announces progress and marks the list and button busy while refreshing', async () => {
  const pending = Promise.withResolvers<void>();
  const screen = await render(PullToRefreshFixture, { onRefresh: () => pending.promise });
  const button = screen.getByRole('button', { name: 'Refresh' });

  await button.click();

  await expect.element(screen.getByRole('status')).toHaveTextContent('Refreshing…');
  await expect.element(button).toHaveAttribute('aria-busy', 'true');
  expect(scrollerOf(screen.getByTestId('ptr').element()).ariaBusy).toBe('true');

  pending.resolve();
  await expect.element(screen.getByRole('status')).toHaveTextContent('Updated');
  await expect.element(button).not.toHaveAttribute('aria-busy', 'true');
});

test('resets and announces nothing when the refresh fails', async () => {
  const screen = await render(PullToRefreshFixture, {
    onRefresh: () => Promise.reject(new Error('offline')),
  });

  await screen.getByRole('button', { name: 'Refresh' }).click();

  await expect.element(screen.getByRole('status')).toHaveTextContent('');
  await expect
    .element(screen.getByRole('button', { name: 'Refresh' }))
    .not.toHaveAttribute('aria-busy', 'true');
});

test('aborts the signal when unmounted mid-refresh', async () => {
  let signal: AbortSignal | undefined;
  const screen = await render(PullToRefreshFixture, {
    onRefresh: (given: AbortSignal) => {
      signal = given;
      return new Promise<void>(() => {});
    },
  });

  await screen.getByRole('button', { name: 'Refresh' }).click();
  expect(signal?.aborted).toBe(false);
  await screen.unmount();

  expect(signal?.aborted).toBe(true);
});

test('setting refreshing from outside starts a refresh', async () => {
  const onRefresh = vi.fn<(signal: AbortSignal) => Promise<void>>(() => Promise.resolve());
  const screen = await render(PullToRefreshFixture, { onRefresh });

  await screen.rerender({ onRefresh, refreshing: true });

  await expect.poll(() => onRefresh.mock.calls.length).toBe(1);
});

test('keeps the button in the DOM when hidden, and does nothing while disabled', async () => {
  const onRefresh = vi.fn<(signal: AbortSignal) => Promise<void>>(() => Promise.resolve());
  const screen = await render(PullToRefreshFixture, {
    onRefresh,
    showButton: false,
    disabled: true,
  });

  const button = screen.getByRole('button', { name: 'Refresh' });
  await expect.element(button).toHaveClass('sr-only');
  drag(scrollerOf(screen.getByTestId('ptr').element()), 100);

  expect(onRefresh).not.toHaveBeenCalled();
});
