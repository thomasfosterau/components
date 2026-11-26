import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import type { ImportResult } from '../../src/svelte/index.ts';
import ImportMapper from '../../src/svelte/ImportMapper.svelte';
import { Xlsx } from '@thomasfosterau/effect-document/ooxml';
import {
  cleanCsv,
  contactTarget,
  csvWithIssues,
  fileOf,
  formats,
  workbookFile,
} from './fixtures.ts';

// `render` instantiates a generic component at its constraint, so the
// suite's callbacks take any record; the type-level link from the target to
// `records` is pinned by svelte-check over the stories instead.
type Submit = (result: ImportResult<unknown>, signal: AbortSignal) => Promise<void>;

/** The text of the step marked `aria-current="step"`. */
const currentStep = (): string | undefined =>
  document.querySelector('[aria-label="Import progress"] [aria-current="step"]')?.textContent ??
  undefined;

test('a clean CSV goes from file to records', async () => {
  const onSubmit = vi.fn<Submit>(async () => {});
  const screen = await render(ImportMapper, {
    props: { target: contactTarget, formats, onSubmit },
  });

  await expect.poll(currentStep).toContain('Choose a file');
  const next = screen.getByRole('button', { name: 'Continue' });
  await expect.element(next).toBeDisabled();

  await screen.getByLabelText(/^File to import/u).upload(cleanCsv());
  await expect.element(screen.getByText('Detected CSV, 1 table.')).toBeVisible();
  await next.click();

  const read = screen.getByRole('heading', { name: 'Check the table' });
  await expect.element(read).toHaveFocus();
  await expect.poll(currentStep).toContain('Check the table');
  await expect
    .element(screen.getByRole('checkbox', { name: 'The first row is the header' }))
    .toBeChecked();
  await expect.element(screen.getByRole('status')).toHaveTextContent('2 rows to import.');
  await next.click();

  const heading = screen.getByRole('heading', { name: 'Match the columns' });
  await expect.element(heading).toHaveFocus();
  await expect.poll(currentStep).toContain('Match the columns');
  await expect.element(screen.getByRole('region', { name: 'Match the columns' })).toBeVisible();
  await next.click();

  await expect.element(screen.getByRole('heading', { name: 'Import' })).toHaveFocus();
  await screen.getByRole('button', { name: 'Import 2 records' }).click();
  await expect.element(screen.getByText('Imported.')).toBeVisible();

  const [result] = onSubmit.mock.calls[0] ?? [];
  expect(result?.records).toEqual([
    { name: 'Ada Lovelace', email: 'ada@example.com', tier: 'pro' },
    { name: 'Lin', email: 'lin@example.com', tier: 'free' },
  ]);
  expect(result?.spec.fields).toEqual({
    name: { kind: 'column', column: { header: 'Name', index: 0 }, parse: { trimWhitespace: true } },
    email: {
      kind: 'column',
      column: { header: 'E-mail', index: 1 },
      parse: { trimWhitespace: true },
    },
    tier: { kind: 'column', column: { header: 'Plan', index: 2 }, parse: { trimWhitespace: true } },
  });
  expect(result?.spec.fingerprint).toEqual({
    format: 'csv',
    headers: ['name', 'e-mail', 'plan', 'notes'],
  });
});

test('an unmapped required field blocks going on and takes focus', async () => {
  const screen = await render(ImportMapper, {
    props: {
      target: contactTarget,
      formats,
      onSubmit: async () => {},
    },
  });

  await screen
    .getByLabelText(/^File to import/u)
    .upload(fileOf('people.csv', 'Who,Plan\nAda,pro\n'));
  await expect.element(screen.getByText('Detected CSV, 1 table.')).toBeVisible();
  const next = screen.getByRole('button', { name: 'Continue' });
  await next.click();
  await next.click();
  await next.click();

  const name = screen.getByRole('combobox', { name: /^Full name/u });
  await expect.element(name).toHaveFocus();
  await expect.element(name).toHaveAttribute('aria-invalid', 'true');
  await expect.poll(currentStep).toContain('Match the columns');

  await name.selectOptions('Who');
  await screen.getByRole('combobox', { name: /^Email/u }).selectOptions('Who');
  await next.click();
  await expect.element(screen.getByRole('heading', { name: 'Import' })).toHaveFocus();
});

test('going back keeps the choices', async () => {
  const screen = await render(ImportMapper, {
    props: {
      target: contactTarget,
      formats,
      onSubmit: async () => {},
    },
  });

  await screen.getByLabelText(/^File to import/u).upload(cleanCsv());
  await expect.element(screen.getByText('Detected CSV, 1 table.')).toBeVisible();
  const next = screen.getByRole('button', { name: 'Continue' });
  await next.click();
  await next.click();
  await screen.getByRole('combobox', { name: 'Plan' }).selectOptions('Notes');
  await next.click();
  await screen.getByRole('button', { name: 'Back' }).click();

  await expect.element(screen.getByRole('heading', { name: 'Match the columns' })).toHaveFocus();
  await expect.element(screen.getByRole('combobox', { name: 'Plan' })).toHaveValue('3');
});

test("rows with issues are left out under 'exclude'", async () => {
  const onSubmit = vi.fn<Submit>(async () => {});
  const screen = await render(ImportMapper, {
    props: {
      target: contactTarget,
      formats,
      onSubmit,
      invalidRows: 'exclude',
    },
  });

  await screen.getByLabelText(/^File to import/u).upload(csvWithIssues());
  await expect.element(screen.getByText('Detected CSV, 1 table.')).toBeVisible();
  const next = screen.getByRole('button', { name: 'Continue' });
  await next.click();
  await next.click();
  await next.click();

  await expect.element(screen.getByText('1 row has issues.', { exact: false })).toBeVisible();
  await screen.getByRole('button', { name: 'Import 2 records' }).click();
  await expect.element(screen.getByText('Imported.')).toBeVisible();
  const [result] = onSubmit.mock.calls[0] ?? [];
  expect(result?.records).toEqual([
    expect.objectContaining({ name: 'Ada Lovelace' }),
    expect.objectContaining({ name: 'Lin' }),
  ]);
  expect(result?.excluded).toEqual([2]);
});

test('a sheet of a workbook, under a title row the user skips', async () => {
  const onSubmit = vi.fn<Submit>(async () => {});
  const screen = await render(ImportMapper, {
    props: { target: contactTarget, formats: [...formats, Xlsx.format], onSubmit },
  });

  await screen.getByLabelText(/^File to import/u).upload(
    await workbookFile('contacts.xlsx', {
      Notes: [['Exported from the old system']],
      People: [
        ['Contacts, May', ''],
        ['Name', 'E-mail'],
        ['Ada Lovelace', 'ada@example.com'],
        ['Lin', 'lin@example.com'],
      ],
    }),
  );
  await expect.element(screen.getByText('Detected Excel workbook, 2 tables.')).toBeVisible();
  await screen.getByRole('combobox', { name: 'Table to import' }).selectOptions('People');
  const next = screen.getByRole('button', { name: 'Continue' });
  await next.click();

  await expect.element(screen.getByRole('heading', { name: 'Check the table' })).toHaveFocus();
  const header = screen.getByRole('checkbox', { name: 'The first row is the header' });
  await expect.element(header).not.toBeChecked();
  await header.click();
  const skip = screen.getByRole('spinbutton', { name: /^Rows to skip at the top/u });
  await skip.fill('1');
  await userEvent.keyboard('{Enter}');
  await expect.element(screen.getByRole('status')).toHaveTextContent('2 rows to import.');
  await next.click();

  await expect.element(screen.getByRole('combobox', { name: /^Full name/u })).toHaveValue('0');
  await expect.element(screen.getByRole('combobox', { name: /^Email/u })).toHaveValue('1');
  await next.click();
  await screen.getByRole('button', { name: 'Import 2 records' }).click();
  await expect.element(screen.getByText('Imported.')).toBeVisible();

  const [result] = onSubmit.mock.calls[0] ?? [];
  expect(result?.records).toEqual([
    { name: 'Ada Lovelace', email: 'ada@example.com' },
    { name: 'Lin', email: 'lin@example.com' },
  ]);
  expect(result?.spec.source).toEqual({
    format: 'xlsx',
    readerOptions: {},
    table: [1],
    headerRow: 0,
    skipRows: 1,
  });
});
