import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import MultiSelectFixture from './fixtures/MultiSelectFixture.svelte';

test('is a combobox named by its label, showing the placeholder', async () => {
  const screen = await render(MultiSelectFixture, {});

  const trigger = screen.getByRole('combobox', { name: 'Growing conditions' });
  await expect.element(trigger).toHaveTextContent('Select…');
  await expect.element(trigger).toHaveAccessibleDescription('Pick all that apply.');
});

test('the listbox is multiselectable and stays open while options are toggled', async () => {
  const screen = await render(MultiSelectFixture, {});

  await userEvent.click(screen.getByRole('combobox', { name: 'Growing conditions' }));
  const listbox = screen.getByRole('listbox');
  await expect.element(listbox).toBeVisible();
  await expect.element(listbox).toHaveAttribute('aria-multiselectable', 'true');

  await userEvent.click(screen.getByRole('option', { name: 'Well-drained' }));
  await userEvent.click(screen.getByRole('option', { name: 'Full sun' }));

  await expect
    .element(screen.getByRole('option', { name: 'Full sun' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect
    .element(screen.getByRole('option', { name: 'Well-drained' }))
    .toHaveAttribute('aria-selected', 'true');
  await expect.element(listbox).toBeVisible();
  // Option order, not click order.
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Full sun|Well-drained');
});

test('the trigger summarises, then overflows past maxShown', async () => {
  const screen = await render(MultiSelectFixture, { values: ['Full sun', 'Well-drained'] });

  const trigger = screen.getByRole('combobox', { name: 'Growing conditions' });
  await expect.element(trigger).toHaveTextContent('Full sun, Well-drained');

  await userEvent.click(trigger);
  await userEvent.click(screen.getByRole('option', { name: 'Moist' }));
  await expect.element(trigger).toHaveTextContent('Full sun, Well-drained, +1');
});

test('Escape closes the listbox and focus returns to the trigger', async () => {
  const screen = await render(MultiSelectFixture, {});

  const trigger = screen.getByRole('combobox', { name: 'Growing conditions' });
  await userEvent.click(trigger);
  await expect.element(screen.getByRole('listbox')).toBeVisible();
  await userEvent.keyboard('{Escape}');

  await expect.element(screen.getByRole('listbox')).not.toBeInTheDocument();
  await expect.element(trigger).toHaveFocus();
});

test('a wrapping form posts one entry per selected value', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(MultiSelectFixture, { values: ['Moist', 'Full sun'], onSubmitted });

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.getAll('conditions')).toEqual(['Full sun', 'Moist']);
});

test('a disabled option cannot be selected', async () => {
  const screen = await render(MultiSelectFixture, {});

  await userEvent.click(screen.getByRole('combobox', { name: 'Growing conditions' }));
  const bog = screen.getByRole('option', { name: 'Bog' });
  await expect.element(bog).toHaveAttribute('aria-disabled', 'true');
  (bog.element() as HTMLElement).click();
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('');
});

test('errors mark the trigger invalid', async () => {
  const screen = await render(MultiSelectFixture, { errors: ['Pick at least one.'] });

  await expect
    .element(screen.getByRole('combobox', { name: 'Growing conditions' }))
    .toHaveAttribute('aria-invalid', 'true');
});
