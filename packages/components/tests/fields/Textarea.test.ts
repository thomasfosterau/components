import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Textarea from '../../src/lib/fields/Textarea.svelte';

test('is a native textbox that accepts typing', async () => {
  const screen = await render(Textarea, { 'aria-label': 'Notes', value: '' });

  const field = screen.getByRole('textbox', { name: 'Notes' });
  await userEvent.fill(field, 'Two of six seedlings survived.');
  await expect.element(field).toHaveValue('Two of six seedlings survived.');
});

test('rows defaults to four and is overridable', async () => {
  const screen = await render(Textarea, { 'aria-label': 'Notes' });
  await expect.element(screen.getByRole('textbox')).toHaveAttribute('rows', '4');

  const taller = await render(Textarea, { 'aria-label': 'Description', rows: 8 });
  await expect
    .element(taller.getByRole('textbox', { name: 'Description' }))
    .toHaveAttribute('rows', '8');
});

test('the FieldControl wiring becomes aria-describedby and aria-invalid', async () => {
  const screen = await render(Textarea, {
    id: 'notes',
    'aria-label': 'Notes',
    describedBy: 'notes-error',
    invalid: true,
  });

  const field = screen.getByRole('textbox');
  await expect.element(field).toHaveAttribute('aria-describedby', 'notes-error');
  await expect.element(field).toHaveAttribute('aria-invalid', 'true');
  await expect.element(field).toHaveClass('textarea-error');
});

test('showCount puts the count in the description', async () => {
  const screen = await render(Textarea, { 'aria-label': 'Notes', maxlength: 280, showCount: true });
  const field = screen.getByRole('textbox', { name: 'Notes' });

  await userEvent.fill(field, 'a'.repeat(42));
  await expect.element(field).toHaveAccessibleDescription('42 / 280');
});

test('autoGrow grows from minRows to maxRows, then scrolls', async () => {
  const screen = await render(Textarea, {
    'aria-label': 'Notes',
    autoGrow: true,
    minRows: 2,
    maxRows: 4,
  });
  const field = screen.getByRole('textbox', { name: 'Notes' });
  const element = field.element();
  if (!(element instanceof HTMLTextAreaElement)) throw new TypeError('not a textarea');
  const height = (): number => element.getBoundingClientRect().height;

  await expect.element(field).toHaveAttribute('rows', '2');
  await userEvent.fill(field, 'one');
  const one = height();
  await userEvent.fill(field, 'one\ntwo\nthree');
  const three = height();
  await userEvent.fill(field, Array.from({ length: 10 }, (_, i) => `line ${i}`).join('\n'));
  const ten = height();

  expect(one).toBeLessThan(three);
  expect(three).toBeLessThan(ten);
  await userEvent.fill(field, Array.from({ length: 20 }, (_, i) => `line ${i}`).join('\n'));
  expect(height()).toBe(ten);
  expect(element.scrollHeight).toBeGreaterThan(element.clientHeight);
  await expect.element(field).toHaveClass('resize-y');
});
