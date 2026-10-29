/**
 * `Table`'s contract: the caption as the accessible name (visible or not),
 * `<th scope="col">` headers, a sort control that is a real button driving
 * `aria-sort`, and rows that are activatable by keyboard and not only by
 * pointer.
 *
 * The component deliberately does NOT reorder its rows — a server-paged
 * caller sorts server-side — so the sort tests assert the announced state and
 * the reported change, which is the whole of what it promises.
 */

import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import TableFixture from './fixtures/TableFixture.svelte';
import { rows } from './fixtures/table-data.ts';

/** The body rows' first cells, in render order. */
const names = (): string[] =>
  [...document.querySelectorAll('tbody tr')].map(
    (row) => row.querySelector('td')?.textContent?.trim() ?? '',
  );

test('is named by its caption, with a header per column', async () => {
  const screen = await render(TableFixture, { caption: 'Plants' });

  await expect.element(screen.getByRole('table', { name: 'Plants' })).toBeInTheDocument();
  expect(screen.getByRole('columnheader').elements()).toHaveLength(2);
  expect(screen.getByRole('columnheader').elements()[0]?.getAttribute('scope')).toBe('col');
  expect(names()).toEqual(['Basil', 'Tomato', 'Garlic']);
});

test('keeps the caption for assistive technology when captionHidden', async () => {
  const screen = await render(TableFixture, { caption: 'Plants', captionHidden: true });

  // Still the accessible name — hidden is not removed.
  await expect.element(screen.getByRole('table', { name: 'Plants' })).toBeInTheDocument();
  const caption = screen.getByRole('table').element().querySelector('caption');
  expect(caption).toHaveClass('sr-only');
});

test('shows a visible caption when it is not hidden', async () => {
  const screen = await render(TableFixture, { caption: 'Plants' });

  expect(screen.getByRole('table').element().querySelector('caption')).not.toHaveClass('sr-only');
});

test('announces the sort state on the header and reports the change', async () => {
  const onSort = vi.fn();
  const screen = await render(TableFixture, { onSort });

  const header = screen.getByRole('columnheader').elements()[0];
  expect(header).toHaveAttribute('aria-sort', 'none');

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(header).toHaveAttribute('aria-sort', 'ascending');
  expect(onSort).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(header).toHaveAttribute('aria-sort', 'descending');
  expect(onSort).toHaveBeenLastCalledWith({ key: 'name', direction: 'desc' });

  // Third press returns to the caller's own order.
  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(header).toHaveAttribute('aria-sort', 'none');
  expect(onSort).toHaveBeenLastCalledWith(undefined);
});

test('sorts from the keyboard, because the control is a real button', async () => {
  const onSort = vi.fn();
  const screen = await render(TableFixture, { onSort });

  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'Sort by Name' })).toHaveFocus();
  await userEvent.keyboard('{Enter}');

  expect(onSort).toHaveBeenLastCalledWith({ key: 'name', direction: 'asc' });
  expect(screen.getByRole('columnheader').elements()[0]).toHaveAttribute('aria-sort', 'ascending');
});

test('leaves a column that is not sortable silent about sorting', async () => {
  const screen = await render(TableFixture, { sortable: false });

  expect(screen.getByRole('columnheader').elements()[0]).not.toHaveAttribute('aria-sort');
  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('activates a row with Enter and with Space, not only with a click', async () => {
  const onSelect = vi.fn();
  const screen = await render(TableFixture, { sortable: false, onSelect });

  const first = screen.getByRole('button').nth(0);
  const element = first.element();
  expect(element.tagName).toBe('TR');
  await expect.element(first).toHaveAttribute('tabindex', '0');

  (element as HTMLElement).focus();
  await userEvent.keyboard('{Enter}');
  expect(onSelect).toHaveBeenLastCalledWith(rows[0]);

  await userEvent.keyboard(' ');
  expect(onSelect).toHaveBeenCalledTimes(2);

  await userEvent.click(screen.getByRole('button').nth(1));
  expect(onSelect).toHaveBeenLastCalledWith(rows[1]);
});

test('leaves rows inert when no handler is given', async () => {
  const screen = await render(TableFixture, { sortable: false });

  expect(screen.getByRole('row').elements()[1]).not.toHaveAttribute('tabindex');
});

test('spans the empty message across every column', async () => {
  const screen = await render(TableFixture, { rows: [], emptyMessage: 'Nothing planted yet.' });

  await expect
    .element(screen.getByRole('cell', { name: 'Nothing planted yet.' }))
    .toHaveAttribute('colspan', '2');
});

test('prefers the emptyState snippet over the message, and renders a foot', async () => {
  const screen = await render(TableFixture, {
    rows: [],
    sortable: false,
    emptyMessage: 'Nothing planted yet.',
    withEmptyState: true,
    withFoot: true,
  });

  await expect.element(screen.getByText('Sow something.')).toBeInTheDocument();
  expect(screen.getByText('Nothing planted yet.').elements()).toHaveLength(0);
  await expect.element(screen.getByRole('cell', { name: '139 in total' })).toBeInTheDocument();
});

test('carries the size, zebra and pin modifiers onto the table', async () => {
  const screen = await render(TableFixture, {
    size: 'sm',
    zebra: true,
    pinRows: true,
    class: 'mt-4',
  });

  const table = screen.getByRole('table');
  await expect.element(table).toHaveClass('table-sm');
  await expect.element(table).toHaveClass('table-zebra');
  await expect.element(table).toHaveClass('table-pin-rows');
  await expect.element(table).toHaveClass('mt-4');
});

test('a rowHeader column renders its cells as row headers that name the row', async () => {
  const screen = await render(TableFixture, { caption: 'Plants', rowHeader: true });

  const headers = screen.getByRole('rowheader').elements();
  expect(headers.map((cell) => cell.textContent?.trim())).toEqual(['Basil', 'Tomato', 'Garlic']);
  expect(
    headers.every((cell) => cell.tagName === 'TH' && cell.getAttribute('scope') === 'row'),
  ).toBe(true);
  // The other column stays data cells; each row is one header plus one cell.
  expect(screen.getByRole('cell').elements()).toHaveLength(3);
  await expect.element(screen.getByRole('rowheader', { name: 'Basil' })).toBeInTheDocument();
});

test('without rowHeader every body cell is a data cell', async () => {
  const screen = await render(TableFixture, { caption: 'Plants' });

  expect(screen.getByRole('rowheader').elements()).toHaveLength(0);
  expect(screen.getByRole('cell').elements()).toHaveLength(6);
});
