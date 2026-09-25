import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ComboboxFormFixture, { type Taxon } from './fixtures/ComboboxFormFixture.svelte';

const TAXA: readonly Taxon[] = [
  { id: 'rosa-canina', name: 'Rosa canina', rank: 'species' },
  { id: 'rosa-rugosa', name: 'Rosa rugosa', rank: 'species' },
  { id: 'rubus-fruticosus', name: 'Rubus fruticosus', rank: 'species' },
];

/** Resolves after `ms`, honouring the abort signal the component passes it. */
const slowSearch = (ms: number, calls: string[] = []) =>
  vi.fn(
    (query: string, signal: AbortSignal): Promise<readonly Taxon[]> =>
      new Promise((resolve, reject) => {
        calls.push(query);
        const timer = setTimeout(() => {
          resolve(TAXA.filter((taxon) => taxon.name.toLowerCase().includes(query.toLowerCase())));
        }, ms);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          reject(new Error('aborted'));
        });
      }),
  );

test('the input is a combobox, named by its label and collapsed to begin with', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
  await expect.element(input).toHaveAttribute('aria-autocomplete', 'list');
});

test('typing opens the listbox and shows the matching options', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'rosa');

  await expect.element(input).toHaveAttribute('aria-expanded', 'true');
  await expect.element(screen.getByRole('listbox')).toBeInTheDocument();
  await expect.element(screen.getByRole('option', { name: /Rosa canina/ })).toBeInTheDocument();
  expect(screen.getByRole('option').elements()).toHaveLength(2);
});

test('typing highlights the first option, and Enter commits it', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'rosa');

  // bits-ui puts the cursor on the first candidate as soon as there is one,
  // so Enter is a commit rather than a fall-through — which is exactly why
  // the fall-through case below has to be an EMPTY result set.
  const first = screen.getByRole('option', { name: /Rosa canina/ }).element();
  await expect.element(input).toHaveAttribute('aria-activedescendant', first.id);

  await userEvent.keyboard('{Enter}');

  await expect.element(screen.getByTestId('selected')).toHaveTextContent('rosa-canina');
  const hidden = screen.container.querySelector<HTMLInputElement>('input[name="taxonId"]');
  expect(hidden?.value).toBe('rosa-canina');
  await expect.element(input).toHaveValue('Rosa canina');
});

test('ArrowDown moves the cursor on, and Enter commits where it landed', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'rosa');
  await expect.element(screen.getByRole('option', { name: /Rosa rugosa/ })).toBeInTheDocument();

  await userEvent.keyboard('{ArrowDown}');
  const second = screen.getByRole('option', { name: /Rosa rugosa/ }).element();
  await expect.element(input).toHaveAttribute('aria-activedescendant', second.id);

  await userEvent.keyboard('{Enter}');

  await expect.element(screen.getByTestId('selected')).toHaveTextContent('rosa-rugosa');
  const hidden = screen.container.querySelector<HTMLInputElement>('input[name="taxonId"]');
  expect(hidden?.value).toBe('rosa-rugosa');
  await expect.element(input).toHaveValue('Rosa rugosa');
});

test('Escape closes the listbox without selecting anything', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'rosa');
  await expect.element(screen.getByRole('listbox')).toBeInTheDocument();

  await userEvent.keyboard('{Escape}');

  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
  expect(screen.getByRole('listbox').elements()).toHaveLength(0);
  await expect.element(screen.getByTestId('selected')).toHaveTextContent('none');
});

test('Enter with nothing highlighted submits the wrapping form', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(ComboboxFormFixture, { items: TAXA, onSubmitted });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  // A query that matches nothing: the panel opens but there is no option for
  // bits-ui to highlight, so Enter must fall through to the form.
  await userEvent.fill(input, 'zzzz');
  await expect.element(screen.getByText('No matches')).toBeInTheDocument();

  await userEvent.keyboard('{Enter}');

  expect(onSubmitted).toHaveBeenCalledTimes(1);
  await expect.element(screen.getByTestId('selected')).toHaveTextContent('none');
});

test('a badge renders beside the label when getBadge supplies one', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA });

  await userEvent.fill(screen.getByRole('combobox', { name: 'Taxon' }), 'rosa canina');
  const option = screen.getByRole('option', { name: /Rosa canina/ }).element();
  expect(option.querySelector('.badge')?.textContent).toBe('species');
});

test('an asynchronous search is debounced into one call and its results render', async () => {
  const calls: string[] = [];
  const onSearch = slowSearch(0, calls);
  const screen = await render(ComboboxFormFixture, { onSearch, debounceMs: 60 });

  await userEvent.fill(screen.getByRole('combobox', { name: 'Taxon' }), 'rosa');

  await expect.element(screen.getByRole('option', { name: /Rosa canina/ })).toBeInTheDocument();
  // `fill` types the whole string; the debounce collapses it to one request.
  expect(calls).toEqual(['rosa']);
});

test('a superseded search is aborted, and the older results stay up until the newer land', async () => {
  const calls: string[] = [];
  const onSearch = slowSearch(120, calls);
  const screen = await render(ComboboxFormFixture, { onSearch, debounceMs: 10 });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'rosa');
  await expect.element(screen.getByRole('option', { name: /Rosa canina/ })).toBeInTheDocument();

  // A second query supersedes the first mid-flight. The first request's
  // promise rejects through its abort signal and must not clear the list.
  await userEvent.fill(input, 'rubus');
  await expect.element(screen.getByRole('option', { name: /Rosa canina/ })).toBeInTheDocument();

  await expect
    .element(screen.getByRole('option', { name: /Rubus fruticosus/ }))
    .toBeInTheDocument();
  expect(screen.getByRole('option').elements()).toHaveLength(1);
  expect(calls).toEqual(['rosa', 'rubus']);
});

test('emptying the field closes the panel and forgets the results', async () => {
  const onSearch = slowSearch(0);
  const screen = await render(ComboboxFormFixture, { onSearch, debounceMs: 10 });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'rosa');
  await expect.element(screen.getByRole('option', { name: /Rosa canina/ })).toBeInTheDocument();

  await userEvent.clear(input);

  await expect.element(input).toHaveAttribute('aria-expanded', 'false');
});
