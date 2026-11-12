import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ErrorSummary from '../../src/lib/forms/ErrorSummary.svelte';
import { errorSummaryItems, fieldId } from '../../src/lib/forms/error-summary.ts';
import ErrorSummaryPage from './fixtures/ErrorSummaryPage.svelte';

const bed = { fieldId: 'bed-name', message: 'Enter a bed name' };
const garden = { fieldId: 'garden', message: 'Enter a garden' };

const inViewport = (element: Element): boolean => {
  const box = element.getBoundingClientRect();
  return box.top >= 0 && box.bottom <= window.innerHeight;
};

test('a summary with two errors is a focused, named alert of links', async () => {
  const screen = await render(ErrorSummaryPage, { errors: [bed, garden] });

  const summary = screen.getByRole('alert', { name: 'There is a problem' });
  await expect.element(summary).toHaveFocus();
  await expect.element(summary).toHaveAttribute('tabindex', '-1');
  await expect
    .element(summary.getByRole('heading', { level: 2 }))
    .toHaveTextContent('There is a problem');
  const link = summary.getByRole('link', { name: 'Enter a bed name' });
  await expect.element(link).toHaveAttribute('href', '#bed-name');
  await expect.element(summary.getByRole('link', { name: 'Enter a garden' })).toBeInTheDocument();
});

test('clicking a link focuses the control and brings its label into view', async () => {
  const screen = await render(ErrorSummaryPage, { errors: [bed, garden] });

  await screen.getByRole('link', { name: 'Enter a bed name' }).click();

  await expect.element(screen.getByRole('textbox', { name: 'Bed name' })).toHaveFocus();
  const label = screen.container.querySelector('label[for="bed-name"]');
  expect(label).not.toBeNull();
  expect(inViewport(label!)).toBe(true);
});

test('a link to a group focuses its first control and shows the legend', async () => {
  const screen = await render(ErrorSummaryPage, {
    errors: [{ fieldId: 'tags', message: 'Choose at least one tag' }],
  });

  await screen.getByRole('link', { name: 'Choose at least one tag' }).click();

  await expect.element(screen.getByRole('checkbox', { name: 'Shady' })).toHaveFocus();
  const legend = screen.container.querySelector('legend');
  expect(inViewport(legend!)).toBe(true);
});

test('empty errors render nothing', async () => {
  const screen = await render(ErrorSummary, { errors: [] });
  expect(screen.getByRole('alert').elements()).toHaveLength(0);
});

test('form-level messages are listed above the links, unlinked', async () => {
  const screen = await render(ErrorSummary, {
    errors: [bed],
    formErrors: ['Your session expired'],
  });
  const summary = screen.getByRole('alert', { name: 'There is a problem' });
  await expect.element(summary.getByText('Your session expired')).toBeInTheDocument();
  expect(summary.getByRole('link').elements()).toHaveLength(1);
});

test('only formErrors is enough to show it', async () => {
  const screen = await render(ErrorSummary, { errors: [], formErrors: ['Your session expired'] });
  await expect.element(screen.getByRole('alert', { name: 'There is a problem' })).toHaveFocus();
});

test('a record is linked through formId', async () => {
  const screen = await render(ErrorSummary, {
    errors: { name: ['Enter a name', 'Too short'], notes: [] },
    formId: 'bed',
  });
  await expect
    .element(screen.getByRole('link', { name: 'Enter a name' }))
    .toHaveAttribute('href', '#bed-name');
  await expect.element(screen.getByRole('link', { name: 'Too short' })).toBeInTheDocument();
  expect(screen.getByRole('listitem').elements()).toHaveLength(2);
});

test('title is a prop, and the root takes class, id and data attributes', async () => {
  const screen = await render(ErrorSummary, {
    errors: [bed],
    title: 'Corrigez ceci',
    id: 'summary',
    class: 'extra',
    'data-testid': 'x',
  });
  const summary = screen.getByRole('alert', { name: 'Corrigez ceci' });
  await expect.element(summary).toHaveAttribute('id', 'summary');
  await expect.element(summary).toHaveClass('alert-error', 'extra');
  await expect.element(summary).toHaveAttribute('data-testid', 'x');
});

test('autofocus false leaves focus alone', async () => {
  const screen = await render(ErrorSummary, { errors: [bed], autofocus: false });
  await expect.element(screen.getByRole('alert', { name: 'There is a problem' })).not.toHaveFocus();
});

test('going from no errors to two focuses the summary', async () => {
  const screen = await render(ErrorSummaryPage, { errors: [] });
  expect(screen.getByRole('alert').elements()).toHaveLength(0);

  await screen.getByRole('button', { name: 'Fail two' }).click();

  await expect.element(screen.getByRole('alert', { name: 'There is a problem' })).toHaveFocus();
});

test('fixing a field, or rewording its message, does not steal focus', async () => {
  const screen = await render(ErrorSummaryPage, { errors: [bed, garden] });
  const summary = screen.getByRole('alert', { name: 'There is a problem' });
  await expect.element(summary).toHaveFocus();

  const field = screen.getByRole('textbox', { name: 'Garden' });
  await field.click();
  await expect.element(field).toHaveFocus();

  // Same field ids, new message text.
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  await screen.getByRole('button', { name: 'Reword' }).click();
  await expect
    .element(screen.getByRole('link', { name: 'Bed name is too short' }))
    .toBeInTheDocument();
  await expect.element(summary).not.toHaveFocus();

  // One error fixed.
  await screen.getByRole('button', { name: 'Fix bed' }).click();
  await expect.element(summary).not.toHaveFocus();
});

test('a newly failing field refocuses the summary', async () => {
  const screen = await render(ErrorSummaryPage, { errors: [bed, garden] });
  await screen.getByRole('button', { name: 'Reword' }).click();
  await expect.element(screen.getByRole('alert', { name: 'There is a problem' })).not.toHaveFocus();

  await screen.getByRole('button', { name: 'Fail three' }).click();
  await expect.element(screen.getByRole('alert', { name: 'There is a problem' })).toHaveFocus();
});

test('a repeat submission with the same errors refocuses when focusKey changes', async () => {
  const screen = await render(ErrorSummaryPage, { errors: [bed, garden], focusKey: 1 });
  const summary = screen.getByRole('alert', { name: 'There is a problem' });
  await screen.getByRole('textbox', { name: 'Garden' }).click();
  await expect.element(summary).not.toHaveFocus();

  await screen.getByRole('button', { name: 'Submit again' }).click();
  await expect.element(summary).toHaveFocus();
});

test('document.title is prefixed while errors show and restored when they clear', async () => {
  document.title = 'Edit bed – App';
  const screen = await render(ErrorSummaryPage, { errors: [bed] });
  expect(document.title).toBe('Error: Edit bed – App');

  await screen.getByRole('button', { name: 'Clear' }).click();
  await expect.poll(() => document.title).toBe('Edit bed – App');
});

test('document.title is restored on unmount, and a custom or empty prefix is honoured', async () => {
  document.title = 'Edit bed – App';
  const screen = await render(ErrorSummary, { errors: [bed], titlePrefix: 'Problem: ' });
  expect(document.title).toBe('Problem: Edit bed – App');
  await screen.unmount();
  expect(document.title).toBe('Edit bed – App');

  const plain = await render(ErrorSummary, { errors: [bed], titlePrefix: '' });
  expect(document.title).toBe('Edit bed – App');
  await plain.unmount();
});

test('a title the server already prefixed is not prefixed twice', async () => {
  document.title = 'Error: Edit bed – App';
  const screen = await render(ErrorSummary, { errors: [bed] });
  expect(document.title).toBe('Error: Edit bed – App');
  await screen.unmount();
  expect(document.title).toBe('Edit bed – App');
});

test('fieldId joins the form id and the field name, and errorSummaryItems flattens a record', () => {
  expect(fieldId('bed', 'name')).toBe('bed-name');
  expect(fieldId('', 'name')).toBe('name');
  expect(errorSummaryItems({ a: ['x', 'y'], b: ['z'] }, 'f')).toEqual([
    { fieldId: 'f-a', message: 'x' },
    { fieldId: 'f-a', message: 'y' },
    { fieldId: 'f-b', message: 'z' },
  ]);
});
