/**
 * `Duration` and `duration.ts` — a localised length of time in a `<time>`
 * whose `datetime` is the ISO duration, with a localised fallback where
 * `Intl.DurationFormat` is missing.
 */

import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Duration from '../../src/lib/formatting/Duration.svelte';
import {
  durationFromMilliseconds,
  formatDuration,
  toIsoDuration,
} from '../../src/lib/formatting/duration.ts';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('2 h 30 min: localised text in a <time datetime="PT2H30M">', async () => {
  const screen = await render(Duration, { value: { hours: 2, minutes: 30 }, locales: 'en' });

  const time = screen.container.querySelector('time');
  expect(time?.getAttribute('datetime')).toBe('PT2H30M');
  expect(time?.textContent).toMatch(/2 hr.*30 min/);
});

test('locales and style change the spelling', async () => {
  const german = await render(Duration, {
    value: { hours: 2, minutes: 30 },
    locales: 'de',
    style: 'long',
  });
  expect(german.container.querySelector('time')?.textContent).toMatch(/2 Stunden.*30 Minuten/);
  german.unmount();

  const clock = await render(Duration, {
    value: { hours: 2, minutes: 30 },
    locales: 'en',
    style: 'digital',
  });
  expect(clock.container.querySelector('time')?.textContent).toBe('2:30:00');
});

test('milliseconds are accepted as the value', async () => {
  const screen = await render(Duration, { value: 9_309_000, locales: 'en' });

  expect(screen.container.querySelector('time')?.getAttribute('datetime')).toBe('PT2H35M9S');
});

test('without Intl.DurationFormat the fallback is still localised', () => {
  vi.stubGlobal('Intl', { NumberFormat: Intl.NumberFormat, ListFormat: Intl.ListFormat });

  expect(formatDuration({ hours: 2, minutes: 30 }, 'en', 'short')).toMatch(/2 hr.*30 min/);
  expect(formatDuration({ hours: 2, minutes: 30 }, 'de', 'long')).toMatch(/2 Stunden.*30 Minuten/);
  expect(formatDuration({ hours: 2, minutes: 30, seconds: 5 }, 'en', 'digital')).toBe('2:30:05');
});

test('durationFromMilliseconds splits and drops the zero fields', () => {
  expect(durationFromMilliseconds(9_309_000)).toEqual({ hours: 2, minutes: 35, seconds: 9 });
  expect(durationFromMilliseconds(90_061_500)).toEqual({
    days: 1,
    hours: 1,
    minutes: 1,
    seconds: 1,
    milliseconds: 500,
  });
  expect(durationFromMilliseconds(-5)).toEqual({});
});

test('toIsoDuration covers dates, fractions and the empty duration', () => {
  expect(toIsoDuration({ years: 1, weeks: 2, days: 3 })).toBe('P1Y2W3D');
  expect(toIsoDuration({ seconds: 1, milliseconds: 250 })).toBe('PT1.25S');
  expect(toIsoDuration({})).toBe('PT0S');
});
