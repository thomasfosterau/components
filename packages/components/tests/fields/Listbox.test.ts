/**
 * `Listbox`'s contract, the APG listbox: one tab stop named by the
 * `FormField` label, `aria-activedescendant` focus, selection that follows
 * focus in single mode, the recommended multi-select model (Space, Shift
 * ranges, Ctrl/⌘+A, modifier clicks), the toggle model, typeahead, skipped
 * disabled options, named groups, and the values a form posts.
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ListboxFixture from './fixtures/ListboxFixture.svelte';

const selectedNames = (): string[] =>
  [...document.querySelectorAll('[role="option"][aria-selected="true"]')].map(
    (node) => node.textContent?.trim() ?? '',
  );

test('is one tab stop, named by its label and described by its hint', async () => {
  const screen = await render(ListboxFixture, {});

  const listbox = screen.getByRole('listbox', { name: 'Template' });
  await userEvent.tab();
  await expect.element(listbox).toHaveFocus();
  await expect.element(listbox).toHaveAccessibleDescription('Where it grows.');
  await expect.element(listbox).not.toHaveAttribute('aria-multiselectable');
  expect(screen.getByRole('option').elements()).toHaveLength(5);
});

test('single: arrows move and select, and the active option is the activedescendant', async () => {
  const screen = await render(ListboxFixture, {});

  await userEvent.tab();
  await userEvent.keyboard('{ArrowDown}');
  const container = screen.getByRole('option', { name: 'Container' });
  await expect.element(container).toHaveAttribute('aria-selected', 'true');
  await expect
    .element(screen.getByRole('listbox'))
    .toHaveAttribute('aria-activedescendant', container.element().id);
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Container');
});

test('a disabled option is skipped by the arrows but still shown', async () => {
  const screen = await render(ListboxFixture, {});

  await userEvent.tab();
  await userEvent.keyboard('{ArrowDown}{ArrowDown}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Rockery');
  await expect
    .element(screen.getByRole('option', { name: 'Greenhouse' }))
    .toHaveAttribute('aria-disabled', 'true');
});

test('typeahead moves to the option the typed text starts', async () => {
  const screen = await render(ListboxFixture, {});

  await userEvent.tab();
  await userEvent.keyboard('Po');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('Pond margin');
});

test('multiple: arrows move without selecting, and Space toggles', async () => {
  const screen = await render(ListboxFixture, { multiple: true });

  const listbox = screen.getByRole('listbox', { name: 'Template' });
  await expect.element(listbox).toHaveAttribute('aria-multiselectable', 'true');
  await userEvent.tab();
  await userEvent.keyboard('{ArrowDown}');
  expect(selectedNames()).toEqual([]);
  await userEvent.keyboard(' ');
  expect(selectedNames()).toEqual(['Container']);
  await userEvent.keyboard(' ');
  expect(selectedNames()).toEqual([]);
});

test('multiple: Shift+arrows extend the selection, skipping a disabled option', async () => {
  const screen = await render(ListboxFixture, { multiple: true });

  await userEvent.tab();
  await userEvent.keyboard(' {Shift>}{ArrowDown}{ArrowDown}{/Shift}');
  expect(selectedNames()).toEqual(['Raised bed', 'Container', 'Rockery']);
  await expect
    .element(screen.getByTestId('bound'))
    .toHaveTextContent('Raised bed|Container|Rockery');
});

test('multiple: Ctrl+A selects every enabled option', async () => {
  const screen = await render(ListboxFixture, { multiple: true });

  await userEvent.tab();
  await userEvent.keyboard('{Control>}a{/Control}');
  expect(selectedNames()).toEqual(['Raised bed', 'Container', 'Rockery', 'Pond margin']);
  await expect
    .element(screen.getByTestId('bound'))
    .toHaveTextContent('Raised bed|Container|Rockery|Pond margin');
});

test('multiple: a click selects one, Ctrl-click toggles, Shift-click selects a range', async () => {
  const screen = await render(ListboxFixture, { multiple: true });

  await userEvent.click(screen.getByRole('option', { name: 'Raised bed' }));
  await userEvent.click(screen.getByRole('option', { name: 'Rockery' }), { modifiers: ['Shift'] });
  expect(selectedNames()).toEqual(['Raised bed', 'Container', 'Rockery']);

  await userEvent.click(screen.getByRole('option', { name: 'Container' }), {
    modifiers: ['ControlOrMeta'],
  });
  expect(selectedNames()).toEqual(['Raised bed', 'Rockery']);

  await userEvent.click(screen.getByRole('option', { name: 'Pond margin' }));
  expect(selectedNames()).toEqual(['Pond margin']);
});

test('toggle model: a plain click toggles, without modifier semantics', async () => {
  const screen = await render(ListboxFixture, { multiple: true, selectionModel: 'toggle' });

  await userEvent.click(screen.getByRole('option', { name: 'Raised bed' }));
  await userEvent.click(screen.getByRole('option', { name: 'Rockery' }));
  expect(selectedNames()).toEqual(['Raised bed', 'Rockery']);
  await userEvent.click(screen.getByRole('option', { name: 'Raised bed' }));
  expect(selectedNames()).toEqual(['Rockery']);
});

test('grouped options sit in groups named by their headings', async () => {
  const screen = await render(ListboxFixture, { grouped: true });

  const fruit = screen.getByRole('group', { name: 'Fruit' });
  await expect.element(fruit.getByRole('option', { name: 'Chilli' })).toBeInTheDocument();
  await expect
    .element(screen.getByRole('group', { name: 'Leaves' }).getByRole('option', { name: 'Kale' }))
    .toBeInTheDocument();
});

test('the form posts each selected value under the name, in option order', async () => {
  const onSubmitted = vi.fn<(data: FormData) => void>();
  const screen = await render(ListboxFixture, {
    multiple: true,
    values: ['Rockery', 'Raised bed'],
    onSubmitted,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  expect(onSubmitted.mock.calls[0]?.[0].getAll('template')).toEqual(['Raised bed', 'Rockery']);
});
