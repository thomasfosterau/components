/**
 * `PivotTable` renders a static `<table>`: every data cell names its row,
 * column and measure headers through `headers`, row groups collapse to a
 * subtotal, and the configurator re-pivots through its menus.
 */

import { expect, test } from 'vite-plus/test';
import { page, userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import type { PivotConfig } from '../../src/lib/data/pivot.ts';
import type { Harvest } from './fixtures/harvest.ts';
import PivotTableFixture from './fixtures/PivotTableFixture.svelte';

const byBed: PivotConfig<Harvest> = {
  rows: ['bed', 'crop'],
  columns: ['date'],
  values: [{ field: 'kg', agg: 'sum' }],
  dateGrouping: { date: 'month' },
};

const headerText = (cell: Element): string[] =>
  (cell.getAttribute('headers') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? `missing ${id}`);

test('is a captioned table whose cells list every header that names them', async () => {
  await render(PivotTableFixture, { config: byBed });
  const table = page.getByRole('table', { name: 'Harvest by bed' });
  await expect.element(table).toBeVisible();
  await expect.element(page.getByRole('columnheader', { name: 'Total' })).toBeVisible();
  await expect.element(page.getByRole('rowheader', { name: 'Tomato' }).first()).toBeVisible();

  const cell = [...document.querySelectorAll('td[headers]')].find(
    (each) => each.textContent?.trim() === '2.5',
  );
  expect(cell).toBeDefined();
  expect(headerText(cell!)).toEqual(['Bed 1', 'Tomato', 'Jan 2026', 'Sum of kg']);
  expect(cell?.querySelector('data')?.getAttribute('value')).toBe('2.5');

  const total = document.querySelector('tbody tr:last-child td:last-child');
  expect(headerText(total!)).toEqual(['Total', 'Total', 'Sum of kg']);
  expect(total?.textContent?.trim()).toBe('16');
});

test('a row group collapses to its subtotal and expands again', async () => {
  await render(PivotTableFixture, { config: byBed });
  const toggle = page.getByRole('button', { name: 'Bed 1', exact: true });
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
  expect(page.getByRole('rowheader', { name: 'Basil' }).elements()).toHaveLength(2);

  await toggle.click();
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(page.getByRole('rowheader', { name: 'Basil' }).elements()).toHaveLength(1);

  await toggle.click();
  await expect.element(toggle).toHaveAttribute('aria-expanded', 'true');
});

test('without subtotals an open parent row has no data cells', async () => {
  await render(PivotTableFixture, { config: byBed, subtotals: false });
  const row = page.getByRole('row', { name: /^Bed 1/u }).first();
  await expect.element(row).toBeVisible();
  expect(row.element().querySelectorAll('td[headers]')).toHaveLength(0);
});

test('formats numbers in the given locale', async () => {
  await render(PivotTableFixture, { config: byBed, locale: 'de-DE' });
  await expect.element(page.getByRole('cell', { name: '2,5', exact: true })).toBeVisible();
});

test('the configurator moves a field between axes and announces the layout', async () => {
  await render(PivotTableFixture, { config: byBed });
  await page.getByRole('button', { name: 'Crop', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Move to Columns' }).click();
  await expect.element(page.getByTestId('rows')).toHaveTextContent('bed');
  await expect
    .element(page.getByRole('status'))
    .toHaveTextContent('Rows: Bed. Columns: Date, Crop. Values: Sum of kg.');
  await expect.element(page.getByRole('columnheader', { name: 'Basil' }).first()).toBeVisible();
});

test('changing a measure’s aggregate re-pivots', async () => {
  await render(PivotTableFixture, { config: byBed });
  await page.getByRole('button', { name: 'Sum of kg' }).click();
  await page.getByRole('menuitemradio', { name: 'Max' }).click();
  await expect.element(page.getByRole('columnheader', { name: 'Max of kg' }).first()).toBeVisible();
  await userEvent.keyboard('{Escape}');
  const total = document.querySelector('tbody tr:last-child td:last-child');
  expect(total?.textContent?.trim()).toBe('6');
});

test('shows the empty label without data', async () => {
  await render(PivotTableFixture, { config: { ...byBed, values: [] } });
  await expect.element(page.getByRole('cell', { name: 'No data' })).toBeVisible();
  await expect.element(page.getByText('None')).toBeVisible();
});
