import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import MentionInputFixture from './fixtures/MentionInputFixture.svelte';

const text = (id: string): string =>
  document.querySelector(`[data-testid="${id}"]`)?.textContent ?? '';

test('a trigger opens suggestions and wires the combobox to them', async () => {
  const screen = await render(MentionInputFixture);
  const field = screen.getByRole('combobox', { name: 'Note' });

  await expect.element(field).toHaveAttribute('aria-expanded', 'false');
  await userEvent.type(field, 'Hi @tho');

  const listbox = screen.getByRole('listbox');
  await expect.element(listbox.getByRole('option', { name: /Thomas Foster/ })).toBeVisible();
  await expect.element(field).toHaveAttribute('aria-expanded', 'true');
  await expect
    .element(field)
    .toHaveAttribute('aria-activedescendant', listbox.getByRole('option').first().element().id);
});

test('Enter inserts the mention: markup in the value, the label in the field, caret after it', async () => {
  const screen = await render(MentionInputFixture);
  const field = screen.getByRole('combobox', { name: 'Note' });

  await userEvent.type(field, 'Hi @tho');
  await expect.element(screen.getByRole('option', { name: /Thomas Foster/ })).toBeVisible();
  await userEvent.keyboard('{Enter}');

  await expect.poll(() => text('value')).toBe('Hi @[Thomas Foster](user:42) ');
  await expect.element(field).toHaveValue('Hi @Thomas Foster ');
  await expect.element(field).toHaveAttribute('aria-expanded', 'false');
  await userEvent.keyboard('there');
  await expect.poll(() => text('value')).toBe('Hi @[Thomas Foster](user:42) there');
});

test('Backspace right after a mention removes all of it', async () => {
  const screen = await render(MentionInputFixture, { initial: 'Ask @[Thomas Foster](user:42)' });
  const field = screen.getByRole('combobox', { name: 'Note' });

  await expect.element(field).toHaveValue('Ask @Thomas Foster');
  await userEvent.click(field);
  await userEvent.keyboard('{End}{Backspace}');

  await expect.element(field).toHaveValue('Ask ');
  await expect.poll(() => text('value')).toBe('Ask ');
});

test('editing inside a mention turns it back into text', async () => {
  const screen = await render(MentionInputFixture, { initial: '@[Thomas Foster](user:42) ok' });
  const field = screen.getByRole('combobox', { name: 'Note' });
  const element = field.element();
  if (element instanceof HTMLTextAreaElement) {
    element.focus();
    element.setSelectionRange(7, 7);
  }
  await userEvent.keyboard('X');

  await expect.poll(() => text('value')).toBe('@ThomasX Foster ok');
});

test('Escape closes the list and focus stays in the field', async () => {
  const screen = await render(MentionInputFixture);
  const field = screen.getByRole('combobox', { name: 'Note' });

  await userEvent.type(field, '@t');
  await expect.element(field).toHaveAttribute('aria-expanded', 'true');
  await userEvent.keyboard('{Escape}');

  await expect.element(field).toHaveAttribute('aria-expanded', 'false');
  await expect.element(field).toHaveFocus();
  await userEvent.keyboard('i');
  await expect.element(field).toHaveAttribute('aria-expanded', 'false');
});

test('each trigger routes to its own search, arrows move the highlight', async () => {
  const onSearch = vi.fn<(char: string, query: string) => void>();
  const screen = await render(MentionInputFixture, { onSearch });
  const field = screen.getByRole('combobox', { name: 'Note' });

  await userEvent.type(field, 'Sow #t');
  await expect.element(screen.getByRole('option', { name: 'tomato' })).toBeVisible();
  expect(onSearch).toHaveBeenLastCalledWith('#', 't');
  await userEvent.keyboard('{ArrowDown}{Enter}');

  await expect.poll(() => text('value')).toBe('Sow #[thyme](plant:2) ');
  expect(onSearch.mock.calls.every(([char]) => char === '#')).toBe(true);
});

test('a replacing trigger inserts plain text after its minimum characters', async () => {
  const screen = await render(MentionInputFixture);
  const field = screen.getByRole('combobox', { name: 'Note' });

  await userEvent.type(field, 'Hot :s');
  await expect.element(field).toHaveAttribute('aria-expanded', 'false');
  await userEvent.keyboard('u');
  await expect.element(screen.getByRole('option', { name: 'sun' })).toBeVisible();
  await userEvent.keyboard('{Tab}');

  await expect.poll(() => text('value')).toBe('Hot ☀️');
});

test('no suggestions open while composing', async () => {
  const screen = await render(MentionInputFixture);
  const field = screen.getByRole('combobox', { name: 'Note' }).element();
  if (!(field instanceof HTMLTextAreaElement)) throw new Error('expected a textarea');

  field.focus();
  field.dispatchEvent(new CompositionEvent('compositionstart'));
  field.value = '@t';
  field.setSelectionRange(2, 2);
  field.dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(field.getAttribute('aria-expanded')).toBe('false');

  field.dispatchEvent(new CompositionEvent('compositionend'));
  await expect.poll(() => field.getAttribute('aria-expanded')).toBe('true');
});

test('single-line renders an input', async () => {
  const screen = await render(MentionInputFixture, { singleLine: true });

  expect(screen.getByRole('combobox', { name: 'Note' }).element()).toBeInstanceOf(HTMLInputElement);
});
