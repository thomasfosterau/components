/**
 * `DataGrid`'s contract: it is `Table` + `Pagination` plus three decisions —
 * sorting that reorders the rows, a filter that searches every column's
 * VALUE, and a page index that survives a filter shrinking the result out
 * from under it. That last one is the reason the page index is clamped in a
 * derivation rather than reset in the filter's handler.
 */

import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-svelte';
import DataGridFixture from './fixtures/DataGridFixture.svelte';

/** The body rows' first cells, in render order. */
const names = (): string[] =>
  [...document.querySelectorAll('tbody tr')].map(
    (row) => row.querySelector('td')?.textContent?.trim() ?? '',
  );

test('cycles a column through ascending, descending and back to the caller’s order', async () => {
  const screen = await render(DataGridFixture, { paginated: false });
  expect(names()).toEqual(['Basil', 'Tomato', 'Garlic']);

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(names()).toEqual(['Basil', 'Garlic', 'Tomato']);

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(names()).toEqual(['Tomato', 'Garlic', 'Basil']);

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  expect(names()).toEqual(['Basil', 'Tomato', 'Garlic']);
});

test('sorts numbers numerically, not as strings', async () => {
  const screen = await render(DataGridFixture, { paginated: false });

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Count' }));
  // Lexical order would put 100 before 30 before 9.
  expect(names()).toEqual(['Tomato', 'Basil', 'Garlic']);
});

test('filters on every column’s value, cell markup or not', async () => {
  const screen = await render(DataGridFixture, { filterable: true, paginated: false });

  const search = screen.getByRole('searchbox', { name: 'Search' });
  await userEvent.fill(search, 'gar');
  expect(names()).toEqual(['Garlic']);

  // The numeric column is part of the corpus, not just the text ones.
  await userEvent.fill(search, '100');
  expect(names()).toEqual(['Garlic']);

  await userEvent.fill(search, 'zzz');
  await expect.element(screen.getByText('Nothing to show.')).toBeInTheDocument();
});

test('does not strand the reader past the end when a filter shrinks the result', async () => {
  const screen = await render(DataGridFixture, { pageSize: 2, filterable: true });
  expect(names()).toEqual(['Basil', 'Tomato']);
  await expect.element(screen.getByText('Showing 1 to 2 of 3')).toBeInTheDocument();
  await expect.element(screen.getByText('Page 1 of 2')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  expect(names()).toEqual(['Garlic']);
  await expect.element(screen.getByText('Showing 3 to 3 of 3')).toBeInTheDocument();

  // One match, so page 2 no longer exists — the grid clamps rather than
  // rendering an empty body over rows that are right there.
  await userEvent.fill(screen.getByRole('searchbox', { name: 'Search' }), 'Basil');
  expect(names()).toEqual(['Basil']);
});

test('returns to the first page when the sort changes the order under the reader', async () => {
  const screen = await render(DataGridFixture, { pageSize: 2 });

  await userEvent.click(screen.getByRole('button', { name: 'Next' }));
  await expect.element(screen.getByText('Page 2 of 2')).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: 'Sort by Name' }));
  await expect.element(screen.getByText('Page 1 of 2')).toBeInTheDocument();
  expect(names()).toEqual(['Basil', 'Garlic']);
});

test('changes the page size from the labelled select', async () => {
  const screen = await render(DataGridFixture, { pageSize: 2, pageSizeOptions: [2, 10] });
  expect(names()).toHaveLength(2);

  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Rows per page' }), '10');
  expect(names()).toHaveLength(3);
});

test('takes every user-facing string as a prop', async () => {
  const screen = await render(DataGridFixture, {
    filterable: true,
    pageSize: 2,
    filterLabel: 'Filtrer',
    rowsPerPageLabel: 'Lignes par page',
    showingLabel: (start, end, total) => `${start}–${end} sur ${total}`,
    pageOfLabel: (page, pages) => `${page} / ${pages}`,
    previousLabel: 'Précédent',
    nextLabel: 'Suivant',
    paginationLabel: 'Pages',
  });

  await expect.element(screen.getByRole('searchbox', { name: 'Filtrer' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('combobox', { name: 'Lignes par page' }))
    .toBeInTheDocument();
  await expect.element(screen.getByText('1–2 sur 3')).toBeInTheDocument();
  await expect.element(screen.getByText('1 / 2')).toBeInTheDocument();
  await expect.element(screen.getByRole('navigation', { name: 'Pages' })).toBeInTheDocument();
  await expect.element(screen.getByRole('button', { name: 'Suivant' })).toBeInTheDocument();
});

test('hides the pager entirely when the result is empty', async () => {
  const screen = await render(DataGridFixture, { rows: [], emptyMessage: 'No plants.' });

  await expect.element(screen.getByText('No plants.')).toBeInTheDocument();
  expect(screen.getByRole('navigation').elements()).toHaveLength(0);
});
