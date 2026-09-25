import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Checkbox from '../../src/lib/fields/Checkbox.svelte';

test('the inline label names the input, with no id/for pair', async () => {
  const screen = await render(Checkbox, { label: 'Formally published' });

  await expect
    .element(screen.getByRole('checkbox', { name: 'Formally published' }))
    .toBeInTheDocument();
});

test('clicking the label text toggles the box — the whole row is the target', async () => {
  const screen = await render(Checkbox, { label: 'Formally published' });

  const box = screen.getByRole('checkbox', { name: 'Formally published' });
  await expect.element(box).not.toBeChecked();

  await userEvent.click(screen.getByText('Formally published'));
  await expect.element(box).toBeChecked();
});

test('Space toggles it from the keyboard', async () => {
  const screen = await render(Checkbox, { label: 'Formally published', checked: true });

  const box = screen.getByRole('checkbox', { name: 'Formally published' });
  await userEvent.tab();
  await expect.element(box).toHaveFocus();

  await userEvent.keyboard(' ');
  await expect.element(box).not.toBeChecked();
});

test('the FieldControl wiring and native attributes pass through', async () => {
  const screen = await render(Checkbox, {
    label: 'Formally published',
    name: 'formal',
    value: 'yes',
    invalid: true,
    describedBy: 'flags-error',
  });

  const box = screen.getByRole('checkbox', { name: 'Formally published' });
  await expect.element(box).toHaveAttribute('name', 'formal');
  await expect.element(box).toHaveAttribute('value', 'yes');
  await expect.element(box).toHaveAttribute('aria-invalid', 'true');
  await expect.element(box).toHaveAttribute('aria-describedby', 'flags-error');
});

test('disabled is disabled', async () => {
  const screen = await render(Checkbox, { label: 'Cultigen', disabled: true });

  await expect.element(screen.getByRole('checkbox', { name: 'Cultigen' })).toBeDisabled();
});
