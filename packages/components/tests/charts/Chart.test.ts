/**
 * Browser tests for `Chart`.
 *
 * The assertions are about the two things a chart can get wrong invisibly: the
 * figures it claims to show, and whether a reader who cannot resolve the
 * colours can still get at them. Pixel geometry is deliberately not tested — an
 * SVG path is not a contract, and pinning one would fail on every legitimate
 * restyle while catching nothing a reader would notice.
 *
 * @module tests/charts/Chart
 */

import { describe, expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import Chart from '../../src/lib/charts/Chart.svelte';
import type { ChartSeries } from '../../src/lib/charts/types.ts';

const MONTHS = ['Sep', 'Oct', 'Nov'];

const series = (key: string, label: string, values: readonly number[]): ChartSeries => ({
  key,
  label,
  points: values.map((value, index) => ({ label: MONTHS[index] ?? '', value })),
});

describe('the accessible contract', () => {
  test('names the figure for assistive tech and captions it for everyone else', async () => {
    const screen = await render(Chart, {
      title: 'Observations',
      series: [series('a', 'All', [1, 2, 3])],
    });

    await expect.element(screen.getByRole('img')).toHaveAccessibleName('Observations');
    // Twice: the visible caption, and the data table's own `<caption>`.
    expect(screen.getByText('Observations').elements()).toHaveLength(2);
  });

  test('always carries the figures as a table, whatever the marks look like', async () => {
    const screen = await render(Chart, {
      title: 'Observations by kind',
      series: [series('flowering', 'Flowering', [4, 9, 18]), series('pest', 'Pest', [6, 5, 3])],
    });

    await expect
      .element(screen.getByRole('table', { name: 'Observations by kind' }))
      .toBeInTheDocument();
    await expect.element(screen.getByRole('rowheader', { name: 'Nov' })).toBeInTheDocument();
    await expect.element(screen.getByRole('cell', { name: '18' })).toBeInTheDocument();
  });

  test('the table’s caption is a prop of its own when the title is not the right name', async () => {
    const screen = await render(Chart, {
      title: 'Observations',
      tableLabel: 'Observations by month, as a table',
      series: [series('a', 'All', [1, 2, 3])],
    });

    await expect
      .element(screen.getByRole('table', { name: 'Observations by month, as a table' }))
      .toBeInTheDocument();
  });

  test('names the legend, and the name is a prop', async () => {
    const screen = await render(Chart, {
      title: 'Observations by kind',
      legendLabel: 'Kinds of observation',
      series: [series('a', 'Flowering', [1, 2, 3]), series('b', 'Pest', [3, 2, 1])],
    });

    await expect
      .element(screen.getByRole('list', { name: 'Kinds of observation' }))
      .toBeInTheDocument();
  });
});

describe('the figures', () => {
  test('formats every value through the caller’s formatter, table included', async () => {
    const screen = await render(Chart, {
      title: 'Rainfall',
      series: [series('rain', 'Rainfall', [41, 58, 62])],
      formatValue: (value: number) => `${value} mm`,
    });

    await expect.element(screen.getByRole('cell', { name: '41 mm' })).toBeInTheDocument();
  });

  test('fills a missing point with zero rather than leaving the table ragged', async () => {
    const screen = await render(Chart, {
      title: 'Ragged',
      series: [
        series('a', 'Long', [1, 2, 3]),
        { key: 'b', label: 'Short', points: [{ label: 'Sep', value: 9 }] },
      ],
    });

    const cells = screen
      .getByRole('cell')
      .elements()
      .map((cell) => cell.textContent);
    expect(cells).toEqual(['1', '9', '2', '0', '3', '0']);
  });
});

describe('identity is never colour alone', () => {
  test('gives two or more series a legend', async () => {
    const screen = await render(Chart, {
      title: 'Observations by kind',
      series: [series('a', 'Flowering', [1, 2, 3]), series('b', 'Pest', [3, 2, 1])],
    });

    const legend = screen.getByRole('list', { name: 'Series' });
    await expect.element(legend.getByText('Flowering')).toBeInTheDocument();
    await expect.element(legend.getByText('Pest')).toBeInTheDocument();
  });

  test('gives a single series no legend — the title names it', async () => {
    const screen = await render(Chart, {
      title: 'Observations',
      series: [series('a', 'All observations', [1, 2, 3])],
    });

    expect(screen.getByRole('list', { name: 'Series' }).elements()).toHaveLength(0);
  });

  test('draws a fifth series in the neutral slot rather than inventing a hue', async () => {
    const screen = await render(Chart, {
      title: 'Five is a design problem',
      series: ['a', 'b', 'c', 'd', 'e'].map((key, index) =>
        series(key, `Series ${index + 1}`, [1, 2, 3]),
      ),
    });

    const swatches = screen.container.querySelectorAll('li > span[aria-hidden="true"]');
    expect(swatches[3]?.getAttribute('style')).toContain('--color-chart-4');
    expect(swatches[4]?.getAttribute('style')).toContain('--color-neutral');
  });
});

describe('the hover readout', () => {
  test('reports the category and every series’ value under the pointer', async () => {
    const screen = await render(Chart, {
      title: 'Observations by kind',
      showTable: false,
      series: [series('flowering', 'Flowering', [4, 9, 18]), series('pest', 'Pest', [6, 5, 3])],
    });

    await userEvent.hover(screen.getByRole('img'));

    // The plot is hovered at its centre, which is the middle category.
    const readout = screen.getByRole('status');
    await expect.element(readout).toBeInTheDocument();
    await expect.element(readout.getByText('Oct')).toBeInTheDocument();
  });
});

test('renders an empty series list without throwing', async () => {
  const screen = await render(Chart, { title: 'Nothing recorded', series: [] });

  await expect.element(screen.getByRole('img')).toHaveAccessibleName('Nothing recorded');
});

test('merges the caller’s class last', async () => {
  const screen = await render(Chart, {
    title: 'Observations',
    series: [],
    class: 'max-w-lg',
  });

  expect(screen.container.querySelector('figure')?.className).toContain('max-w-lg');
});
