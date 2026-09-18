import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import RelativeTime from '../../src/lib/formatting/RelativeTime.svelte';

const NOW = new Date('2026-09-17T12:00:00.000Z');

test('picks hours as the unit and renders datetime/title (en-AU)', async () => {
  const value = new Date(NOW.getTime() - 3 * 60 * 60 * 1000);
  const screen = await render(RelativeTime, { value, now: NOW, locales: 'en-AU' });

  const time = screen.container.querySelector('time');
  expect(time?.getAttribute('datetime')).toBe(value.toISOString());
  const expectedTitle = new Intl.DateTimeFormat('en-AU', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(value);
  expect(time?.getAttribute('title')).toBe(expectedTitle);

  const expectedText = new Intl.RelativeTimeFormat('en-AU', { numeric: 'auto' }).format(-3, 'hour');
  await expect.element(screen.getByText(expectedText)).toBeInTheDocument();
});

test('picks the largest unit for a multi-year gap', async () => {
  const value = new Date(NOW.getTime() - 3 * 365.25 * 24 * 60 * 60 * 1000);
  const screen = await render(RelativeTime, { value, now: NOW, locales: 'en-AU' });

  const expectedText = new Intl.RelativeTimeFormat('en-AU', { numeric: 'auto' }).format(-3, 'year');
  await expect.element(screen.getByText(expectedText)).toBeInTheDocument();
});

test('renders a future instant and respects numeric="always" in de-DE', async () => {
  const value = new Date(NOW.getTime() + 24 * 60 * 60 * 1000);
  const screen = await render(RelativeTime, {
    value,
    now: NOW,
    locales: 'de-DE',
    numeric: 'always',
  });

  const expectedText = new Intl.RelativeTimeFormat('de-DE', { numeric: 'always' }).format(1, 'day');
  await expect.element(screen.getByText(expectedText)).toBeInTheDocument();
});
