/**
 * `StatTile` and `Stats` — the reading order (label, figure, change) and the
 * one thing the markup cannot convey on its own: the DIRECTION of a change.
 * The arrow is `aria-hidden`, so the direction has to be in the text, and the
 * tone colour is never the only carrier.
 */

import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import StatTile from '../../src/lib/feedback/StatTile.svelte';
import Stats from '../../src/lib/feedback/Stats.svelte';

test('reads label, then figure, then description', async () => {
  const screen = await render(StatTile, {
    label: 'Plants recorded',
    value: 1284,
    description: 'Across 31 beds.',
    locales: 'en-AU',
    'data-testid': 'tile',
  });

  const tile = screen.getByTestId('tile');
  await expect.element(tile).toHaveTextContent('Plants recorded 1,284 Across 31 beds.');
  await expect.element(screen.getByText('1,284')).toHaveClass('stat-value');
});

test('a string value is printed as given', async () => {
  const screen = await render(StatTile, { label: 'Germination rate', value: '68%' });

  await expect.element(screen.getByText('68%')).toBeInTheDocument();
});

test('a rising delta is signed, toned and spelled out', async () => {
  const screen = await render(StatTile, {
    label: 'Plants recorded',
    value: 1284,
    delta: { value: 46, label: 'this month' },
    locales: 'en-AU',
    'data-testid': 'tile',
  });

  await expect.element(screen.getByText('+46 this month')).toBeInTheDocument();
  await expect.element(screen.getByText('Up')).toHaveClass('sr-only');
  expect(screen.getByTestId('tile').element().querySelector('.stat-desc')?.className).toContain(
    'text-success',
  );
});

test('a falling delta announces its direction too', async () => {
  const screen = await render(StatTile, {
    label: 'Beds in use',
    value: 31,
    delta: { value: -2 },
    downLabel: 'Down on last month',
    locales: 'en-AU',
  });

  await expect.element(screen.getByText('-2')).toBeInTheDocument();
  await expect.element(screen.getByText('Down on last month')).toHaveClass('sr-only');
});

test('an unchanged delta is flat, not up', async () => {
  const screen = await render(StatTile, {
    label: 'Seedlings',
    value: 412,
    delta: { value: 0, label: 'this week' },
    locales: 'en-AU',
  });

  await expect.element(screen.getByText('No change')).toBeInTheDocument();
  await expect.element(screen.getByText('0 this week')).toBeInTheDocument();
});

test('the percent unit formats as a signed percentage, the points unit as a decimal', async () => {
  const percent = await render(StatTile, {
    label: 'Germination rate',
    value: '68%',
    delta: { value: 3.2, unit: 'percent' },
    locales: 'en-AU',
  });
  await expect.element(percent.getByText('+3.2%')).toBeInTheDocument();

  const points = await render(StatTile, {
    label: 'Swing',
    value: '+4.1',
    delta: { value: 4.1, unit: 'points', label: 'pts swing' },
    locales: 'en-AU',
  });
  await expect.element(points.getByText('+4.1 pts swing')).toBeInTheDocument();
});

test('the figure snippet lands in the stat-figure slot', async () => {
  const figure = createRawSnippet(() => ({ render: () => '<span>🌱</span>' }));
  const screen = await render(StatTile, {
    label: 'Seedlings',
    value: 412,
    figure,
    'data-testid': 'tile',
  });

  const slot = screen.getByTestId('tile').element().querySelector('.stat-figure');
  expect(slot).toHaveTextContent('🌱');
});

test('Stats wraps its tiles and takes an orientation', async () => {
  const children = createRawSnippet(() => ({
    render: () => '<div class="stat"><div class="stat-title">Beds</div></div>',
  }));
  const screen = await render(Stats, {
    children,
    orientation: 'vertical',
    'aria-label': 'Garden summary',
    'data-testid': 'stats',
  });

  const stats = screen.getByTestId('stats');
  await expect.element(stats).toHaveClass('stats');
  await expect.element(stats).toHaveClass('stats-vertical');
  await expect.element(stats).toHaveAttribute('aria-label', 'Garden summary');
});
