import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ImportFieldMap from '../../src/svelte/ImportFieldMap.svelte';
import { contactTarget, regionOf } from './fixtures.ts';

const table = regionOf(
  'Name,E-mail,Plan,Notes\nAda Lovelace,ada@example.com,pro,first\nLin,lin@example.com,free,\n',
);

test('pre-fills each field from the headers, with a sample, and lists the unused columns', async () => {
  const screen = await render(ImportFieldMap, {
    props: {
      target: contactTarget,
      table,
      read: { headerRow: 0, skipRows: 0 },
    },
  });

  const name = screen.getByRole('combobox', { name: /^Full name/u });
  await expect.element(name).toHaveValue('0');
  await expect
    .element(name)
    .toHaveAccessibleDescription('Suggested from the column headers. Sample: Ada Lovelace, Lin.');
  const email = screen.getByRole('combobox', { name: /^Email/u });
  await expect.element(email).toHaveValue('1');
  await expect
    .element(email)
    .toHaveAccessibleDescription(expect.stringContaining('Where we write to them.'));
  await expect.element(screen.getByRole('combobox', { name: 'Plan' })).toHaveValue('2');
  await expect.element(screen.getByRole('status')).toHaveTextContent('Not imported: Notes.');
});

test('a chosen column is confirmed, and one column can feed two fields', async () => {
  const screen = await render(ImportFieldMap, {
    props: {
      target: contactTarget,
      table,
      read: { headerRow: 0, skipRows: 0 },
    },
  });

  const plan = screen.getByRole('combobox', { name: 'Plan' });
  await plan.selectOptions('Name');
  await expect.element(plan).toHaveValue('0');
  await expect.element(plan).toHaveAccessibleDescription('Sample: Ada Lovelace, Lin.');
  await expect.element(screen.getByRole('status')).toHaveTextContent('Not imported: Plan, Notes.');
});

test('without a header row, the columns are numbered and nothing is suggested', async () => {
  const screen = await render(ImportFieldMap, {
    props: {
      target: contactTarget,
      table,
      read: { headerRow: 0, skipRows: 0 },
    },
  });

  await screen.getByRole('checkbox', { name: 'The first row is the header' }).click();

  const name = screen.getByRole('combobox', { name: /^Full name/u });
  await expect.element(name).toHaveValue('');
  await expect
    .element(screen.getByRole('option', { name: 'Column 1' }).first())
    .toBeInTheDocument();
});

test('a required field with no column shows its error once errors are on', async () => {
  const screen = await render(ImportFieldMap, {
    props: {
      target: contactTarget,
      table: regionOf('Who,Plan\nAda,pro\n'),
      read: { headerRow: 0, skipRows: 0 },
      showErrors: true,
    },
  });

  const email = screen.getByRole('combobox', { name: /^Email/u });
  await expect.element(email).toHaveAttribute('aria-invalid', 'true');
  await expect
    .element(email)
    .toHaveAccessibleDescription(
      expect.stringContaining('Choose a column for this required field.'),
    );
  await expect
    .element(screen.getByRole('combobox', { name: 'Plan' }))
    .not.toHaveAttribute('aria-invalid');
});
