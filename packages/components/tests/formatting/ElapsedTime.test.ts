/**
 * `ElapsedTime` — Countdown's inverse: a named timer counting up, digits
 * hidden, read coarsely, frozen by `stoppedAt`, resumable with `accumulated`.
 */

import { afterEach, beforeEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ElapsedTime from '../../src/lib/formatting/ElapsedTime.svelte';

const START = new Date('2026-10-14T09:00:00Z').getTime();

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] });
  vi.setSystemTime(START);
});

afterEach(() => {
  vi.useRealTimers();
});

const parts = (timer: Element): { shown: string; spoken: string } => ({
  shown: timer.querySelectorAll('[aria-hidden="true"]')[1]?.textContent ?? '',
  spoken: timer.querySelector('.sr-only')?.textContent ?? '',
});

test('a timer named by label, counting up in digits, read coarsely', async () => {
  const screen = await render(ElapsedTime, {
    since: START - (12 * 60_000 + 4_000),
    label: 'Watering for',
    locales: 'en',
  });

  const timer = screen.getByRole('timer', { name: 'Watering for' }).element();
  expect(parts(timer)).toEqual({ shown: '12:04', spoken: '12 minutes' });

  await vi.advanceTimersByTimeAsync(60_000);
  await expect.poll(() => parts(timer)).toEqual({ shown: '13:04', spoken: '13 minutes' });
});

test('under a minute it reads lessThanMinuteLabel; past an hour, hours and minutes', async () => {
  const short = await render(ElapsedTime, {
    since: START - 5_000,
    label: 'Running for',
    locales: 'en',
  });
  expect(parts(short.getByRole('timer').element()).spoken).toBe('Less than a minute');

  const long = await render(ElapsedTime, {
    since: START - (62 * 60_000 + 3_000),
    label: 'Drying for',
    locales: 'en',
  });
  const timer = long.getByRole('timer', { name: 'Drying for' }).element();
  expect(parts(timer).shown).toBe('1:02:03');
  expect(parts(timer).spoken).toMatch(/1 hour, 2 minutes/);
});

test('stoppedAt freezes it, and accumulated carries an earlier run', async () => {
  const screen = await render(ElapsedTime, {
    since: START - 30_000,
    stoppedAt: START,
    accumulated: 60_000,
    label: 'Paused at',
    locales: 'en',
  });

  const timer = screen.getByRole('timer', { name: 'Paused at' }).element();
  expect(parts(timer).shown).toBe('1:30');
  await vi.advanceTimersByTimeAsync(5_000);
  expect(parts(timer).shown).toBe('1:30');
});

test('text display', async () => {
  const screen = await render(ElapsedTime, {
    since: START - 3 * 60_000,
    display: 'text',
    label: 'Running for',
    locales: 'en',
  });

  expect(parts(screen.getByRole('timer').element()).shown).toMatch(/^3 min/);
});

test('spreads native attributes and merges class', async () => {
  const screen = await render(ElapsedTime, {
    since: START,
    label: 'Running for',
    id: 'run',
    class: 'mine',
  });

  const timer = screen.getByRole('timer').element();
  expect(timer.id).toBe('run');
  expect(timer.classList.contains('mine')).toBe(true);
});
