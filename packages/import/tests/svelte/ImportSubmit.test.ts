import { sourceTableFromGrid, type ImportSpec } from '@thomasfosterau/components-import';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import type { ImportResult } from '../../src/svelte/index.ts';
import ImportSubmit from '../../src/svelte/ImportSubmit.svelte';
import { contactTarget } from './fixtures.ts';

const spec: ImportSpec = {
  version: 1,
  source: { format: 'csv', readerOptions: {}, table: [0], headerRow: 0, skipRows: 0 },
  fields: {
    name: { kind: 'column', column: { header: 'Name', index: 0 } },
    email: { kind: 'column', column: { header: 'Email', index: 1 } },
    tier: { kind: 'skip' },
  },
  fingerprint: { format: 'csv', headers: ['name', 'email'] },
};

const table = sourceTableFromGrid(
  [
    ['Name', 'Email'],
    ['Ada', 'ada@example.com'],
    ['Nia', 'not-an-email'],
    ['Lin', 'lin@example.com'],
  ],
  { headerRow: 0, skipRows: 0 },
);

// `render` instantiates a generic component at its constraint, so the
// suite's callbacks take any record; the type-level link from the target to
// `records` is pinned by svelte-check over the stories instead.
type Submit = (result: ImportResult<unknown>, signal: AbortSignal) => Promise<void>;

test('lists each row with issues and blocks the import by default', async () => {
  const onSubmit = vi.fn<Submit>(async () => {});
  const screen = await render(ImportSubmit, {
    props: { target: contactTarget, spec, table, onSubmit },
  });

  await expect
    .element(screen.getByRole('status'))
    .toHaveTextContent('2 records are ready to import.');
  await expect.element(screen.getByText('1 row has issues.', { exact: false })).toBeVisible();
  const issue = screen.getByRole('listitem');
  await expect
    .element(issue)
    .toHaveTextContent('⚠ Issue Row 3, Email: Expected a string matching the RegExp @');
  await expect.element(screen.getByRole('button', { name: 'Import 2 records' })).toBeDisabled();
});

test("under 'exclude', imports the rest and names the rows left out", async () => {
  const onSubmit = vi.fn<Submit>(async () => {});
  const screen = await render(ImportSubmit, {
    props: {
      target: contactTarget,
      spec,
      table,
      onSubmit,
      invalidRows: 'exclude',
    },
  });

  await expect.element(screen.getByText('They will be left out.', { exact: false })).toBeVisible();
  await screen.getByRole('button', { name: 'Import 2 records' }).click();

  await expect.element(screen.getByRole('status')).toHaveTextContent('Imported.');
  const [result, signal] = onSubmit.mock.calls[0] ?? [];
  expect(result?.records).toEqual([
    { name: 'Ada', email: 'ada@example.com' },
    { name: 'Lin', email: 'lin@example.com' },
  ]);
  expect(result?.excluded).toEqual([2]);
  expect(result?.invalid).toEqual([]);
  expect(result?.spec).toBe(spec);
  expect(signal).toBeInstanceOf(AbortSignal);
});

test("under 'allow', passes the rows with issues on", async () => {
  const onSubmit = vi.fn<Submit>(async () => {});
  const screen = await render(ImportSubmit, {
    props: {
      target: contactTarget,
      spec,
      table,
      onSubmit,
      invalidRows: 'allow',
    },
  });

  await screen.getByRole('button', { name: 'Import 2 records' }).click();

  await expect.element(screen.getByRole('status')).toHaveTextContent('Imported.');
  const [result] = onSubmit.mock.calls[0] ?? [];
  expect(result?.excluded).toEqual([]);
  expect(result?.invalid.map((row) => row.row)).toEqual([2]);
});

test('a failed submit is an alert, and the import can be tried again', async () => {
  const onSubmit = vi.fn<Submit>(async () => {
    throw new Error('The server is down.');
  });
  const screen = await render(ImportSubmit, {
    props: {
      target: contactTarget,
      spec,
      table,
      onSubmit,
      invalidRows: 'exclude',
    },
  });

  const button = screen.getByRole('button', { name: 'Import 2 records' });
  await button.click();

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('The import failed. The server is down.');
  await expect.element(button).toBeEnabled();
});

test('a table larger than maxRows is refused', async () => {
  const screen = await render(ImportSubmit, {
    props: {
      target: contactTarget,
      spec,
      table,
      onSubmit: async () => {},
      maxRows: 2,
    },
  });

  await expect
    .element(screen.getByRole('alert'))
    .toHaveTextContent('This table has 3 rows; an import takes at most 2.');
  await expect.element(screen.getByRole('button')).not.toBeInTheDocument();
});
