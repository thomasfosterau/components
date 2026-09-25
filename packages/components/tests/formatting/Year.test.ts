import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Year from '../../src/lib/formatting/Year.svelte';

const timeOf = (container: HTMLElement): HTMLTimeElement | null => container.querySelector('time');

test('a number is a calendar year: datetime is the year string, the text its locale rendering', async () => {
  const screen = await render(Year, { value: 1925, locales: 'en-AU' });
  expect(timeOf(screen.container)?.getAttribute('datetime')).toBe('1925');
  await expect.element(screen.getByText('1925')).toBeInTheDocument();
});

test('an instant uses its UTC year, never the previous one west of Greenwich', async () => {
  const screen = await render(Year, { value: '2026-01-01T00:00:00Z', locales: 'en-US' });
  expect(timeOf(screen.container)?.getAttribute('datetime')).toBe('2026');
  await expect.element(screen.getByText('2026')).toBeInTheDocument();
});

test('pads a short year to four digits', async () => {
  const screen = await render(Year, { value: 79, locales: 'en-AU' });
  expect(timeOf(screen.container)?.getAttribute('datetime')).toBe('0079');
});

test('appends the era when asked', async () => {
  const screen = await render(Year, { value: 1925, era: 'short', locales: 'en-AU' });
  const expected = new Intl.DateTimeFormat('en-AU', {
    year: 'numeric',
    era: 'short',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(1925, 0, 1)));
  await expect.element(screen.getByText(expected)).toBeInTheDocument();
});

test('2-digit representation', async () => {
  const screen = await render(Year, { value: 1925, representation: '2-digit', locales: 'en-AU' });
  await expect.element(screen.getByText('25')).toBeInTheDocument();
  expect(timeOf(screen.container)?.getAttribute('datetime')).toBe('1925');
});

test('spreads native attributes', async () => {
  const screen = await render(Year, { value: 1925, itemprop: 'datePublished', class: 'text-sm' });
  const time = timeOf(screen.container);
  expect(time?.getAttribute('itemprop')).toBe('datePublished');
  expect(time).toHaveClass('text-sm');
});
