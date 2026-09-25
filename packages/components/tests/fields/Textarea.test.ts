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
