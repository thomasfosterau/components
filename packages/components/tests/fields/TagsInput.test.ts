import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import TagsInputFixture from './fixtures/TagsInputFixture.svelte';

const pasteInto = (element: Element, text: string): void => {
  const data = new DataTransfer();
  data.setData('text/plain', text);
  element.dispatchEvent(
    new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }),
  );
};

test('Enter commits the typed text as a tag and empties the input', async () => {
  const screen = await render(TagsInputFixture, {});

  const input = screen.getByLabelText('Tags');
  await userEvent.click(input);
  await userEvent.keyboard('bee-friendly{Enter}');

  await expect.element(screen.getByRole('listitem')).toHaveTextContent('bee-friendly');
  await expect.element(input).toHaveValue('');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('bee-friendly');
});

test('a comma commits; pasting "a, b, c" makes three tags', async () => {
  const screen = await render(TagsInputFixture, {});

  const input = screen.getByLabelText('Tags');
  await userEvent.click(input);
  await userEvent.keyboard('native,');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('native');

  pasteInto(input.element(), 'a, b, c');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('native|a|b|c');
  await expect.element(input).toHaveValue('');
});

test('a duplicate is refused by default, whatever its case', async () => {
  const screen = await render(TagsInputFixture, { values: ['Shade'] });

  await userEvent.click(screen.getByLabelText('Tags'));
  await userEvent.keyboard('shade{Enter}');
  expect(screen.getByRole('listitem').elements()).toHaveLength(1);
});

test('a remove button removes its tag and focus lands on the neighbour, then the input', async () => {
  const screen = await render(TagsInputFixture, { values: ['bee-friendly', 'native'] });

  await userEvent.click(screen.getByRole('button', { name: 'Remove bee-friendly' }));
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('native');
  await expect.element(screen.getByRole('button', { name: 'Remove native' })).toHaveFocus();

  await userEvent.click(screen.getByRole('button', { name: 'Remove native' }));
  await expect.element(screen.getByLabelText('Tags')).toHaveFocus();
});

test('Backspace on an empty input focuses the last tag, a second Backspace removes it and announces', async () => {
  const screen = await render(TagsInputFixture, { values: ['drought-tolerant', 'bee-friendly'] });

  await userEvent.click(screen.getByLabelText('Tags'));
  await userEvent.keyboard('{Backspace}');
  await expect.element(screen.getByRole('button', { name: 'Remove bee-friendly' })).toHaveFocus();

  await userEvent.keyboard('{Backspace}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('drought-tolerant');
  await expect.element(screen.getByText('bee-friendly removed')).toBeInTheDocument();
  await expect
    .element(screen.getByRole('button', { name: 'Remove drought-tolerant' }))
    .toHaveFocus();
});

test('arrow keys move between the tags and back to the input', async () => {
  const screen = await render(TagsInputFixture, { values: ['a', 'b'] });

  const input = screen.getByLabelText('Tags');
  await userEvent.click(input);
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(screen.getByRole('button', { name: 'Remove b' })).toHaveFocus();
  await userEvent.keyboard('{ArrowLeft}');
  await expect.element(screen.getByRole('button', { name: 'Remove a' })).toHaveFocus();
  await userEvent.keyboard('{ArrowRight}{ArrowRight}');
  await expect.element(input).toHaveFocus();

  await userEvent.keyboard('{ArrowLeft}{Delete}');
  await expect.element(screen.getByTestId('bound')).toHaveTextContent(/^a$/);
  await expect.element(screen.getByRole('button', { name: 'Remove a' })).toHaveFocus();
});

test('max disables the input at the cap', async () => {
  const screen = await render(TagsInputFixture, { values: ['a'], max: 2 });

  const input = screen.getByLabelText('Tags');
  await userEvent.click(input);
  await userEvent.keyboard('b{Enter}');
  await expect.element(input).toBeDisabled();
});

test('with suggestions the input is a combobox and Enter on a highlighted option commits it', async () => {
  const screen = await render(TagsInputFixture, {
    suggestions: ['bee-friendly', 'bird-friendly', 'native'],
  });

  const input = screen.getByRole('combobox', { name: 'Tags' });
  await userEvent.click(input);
  await userEvent.keyboard('fri');
  await expect.element(screen.getByRole('option', { name: 'bee-friendly' })).toBeVisible();
  expect(screen.getByRole('option').elements()).toHaveLength(2);

  await userEvent.keyboard('{ArrowDown}{Enter}');
  await expect.element(screen.getByTestId('bound')).not.toHaveTextContent(/^$/);
  expect(screen.getByRole('listitem').elements()).toHaveLength(1);
  await expect.element(input).toHaveValue('');
});

test('async suggestions come from onSearch', async () => {
  const onSearch = vi.fn(async (query: string) => [`${query}-one`, `${query}-two`]);
  const screen = await render(TagsInputFixture, { onSearch });

  await userEvent.click(screen.getByRole('combobox', { name: 'Tags' }));
  await userEvent.keyboard('herb');
  await expect.element(screen.getByRole('option', { name: 'herb-two' })).toBeVisible();
  await userEvent.click(screen.getByRole('option', { name: 'herb-two' }));
  await expect.element(screen.getByTestId('bound')).toHaveTextContent('herb-two');
});

test('a wrapping form posts one entry per tag', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(TagsInputFixture, { values: ['a', 'b'], onSubmitted });

  await userEvent.click(screen.getByRole('button', { name: 'Save' }));
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.getAll('tags')).toEqual(['a', 'b']);
});

test('inside FormField: label, hint, errors, and required means at least one tag', async () => {
  const screen = await render(TagsInputFixture, { errors: ['Add a tag.'], required: true });

  const input = screen.getByLabelText(/Tags/);
  await expect.element(input).toHaveAttribute('aria-invalid', 'true');
  await expect.element(input).toHaveAttribute('aria-required', 'true');
  // Native `required` only while there are no tags; `aria-required` throughout.
  await expect.element(input).toHaveAttribute('required');
  await expect.element(input).toHaveAccessibleDescription(/Press Enter or comma after each\./);

  await userEvent.click(input);
  await userEvent.keyboard('herb{Enter}');
  await expect.element(input).not.toHaveAttribute('required');
  await expect.element(input).toHaveAttribute('aria-required', 'true');
});
