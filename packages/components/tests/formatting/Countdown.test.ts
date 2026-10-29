/**
 * `Countdown` — a named timer whose digits are hidden, whose spoken text
 * changes only at the coarse granularity, and which announces zero once.
 */

import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Countdown from '../../src/lib/formatting/Countdown.svelte';

const START = new Date('2026-10-14T09:00:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

const spoken = (container: HTMLElement): string =>
  container.querySelector('[role="timer"] > .sr-only:not([role])')?.textContent ?? '';

test('a timer named by label, with the ticking digits hidden', async () => {
  const screen = await render(Countdown, {
    until: START + 2 * 60 * 60_000,
    label: 'Seed swap opens in',
    locales: 'en',
  });

  const timer = screen.getByRole('timer', { name: 'Seed swap opens in' });
  await expect.element(timer).toBeInTheDocument();
  const hidden = timer.element().querySelectorAll('[aria-hidden="true"]');
  expect(hidden.length).toBe(2);
  expect(hidden[1]?.querySelector('.countdown')).not.toBeNull();
  expect(spoken(screen.container)).toMatch(/2 hours/);
});

test('the spoken text changes at the minute, not the second', async () => {
  const screen = await render(Countdown, {
    until: START + 5 * 60_000,
    label: 'Watering in',
    locales: 'en',
  });

  expect(spoken(screen.container)).toBe('5 minutes');
  await vi.advanceTimersByTimeAsync(59_000);
  expect(spoken(screen.container)).toBe('5 minutes');
  await vi.advanceTimersByTimeAsync(2_000);
  expect(spoken(screen.container)).toBe('4 minutes');
});

test('at zero a status says completeLabel and onComplete fires exactly once', async () => {
  const onComplete = vi.fn();
  const screen = await render(Countdown, {
    until: START + 3_000,
    label: 'Auction closes in',
    onComplete,
  });

  expect(screen.container.querySelector('[role="status"]')?.textContent).toBe('');
  await vi.advanceTimersByTimeAsync(5_000);
  expect(screen.container.querySelector('[role="status"]')?.textContent).toBe('Time is up');
  await vi.advanceTimersByTimeAsync(5_000);
  expect(onComplete).toHaveBeenCalledTimes(1);
});

test('an instant already past renders complete without calling onComplete', async () => {
  const onComplete = vi.fn();
  const screen = await render(Countdown, { until: START - 1_000, label: 'Opened', onComplete });

  expect(screen.container.querySelector('[role="status"]')?.textContent).toBe('Time is up');
  await vi.advanceTimersByTimeAsync(3_000);
  expect(onComplete).not.toHaveBeenCalled();
});

test('the interval stops on unmount', async () => {
  const onComplete = vi.fn();
  const screen = await render(Countdown, { until: START + 3_000, label: 'Soon', onComplete });

  screen.unmount();
  await vi.advanceTimersByTimeAsync(10_000);
  expect(onComplete).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

test('text display shows the formatted duration; largestUnit folds days into hours', async () => {
  const screen = await render(Countdown, {
    until: START + 50 * 60 * 60_000,
    label: 'Harvest in',
    display: 'text',
    largestUnit: 'hours',
    locales: 'en',
  });

  const visible = screen.getByRole('timer').element().querySelectorAll('[aria-hidden="true"]')[1];
  expect(visible?.textContent).toMatch(/50 hr/);
});
