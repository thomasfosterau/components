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

test('onSelect receives the committed item, from a static list', async () => {
  const onSelect = vi.fn();
  const screen = await render(ComboboxFormFixture, { items: TAXA, onSelect });

  await userEvent.fill(screen.getByRole('combobox', { name: 'Taxon' }), 'rugosa');
  await userEvent.click(screen.getByRole('option', { name: /Rosa rugosa/ }));

  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith(TAXA[1]);
});

test('onSelect receives the committed item, from an asynchronous search', async () => {
  const onSelect = vi.fn();
  const screen = await render(ComboboxFormFixture, {
    onSearch: slowSearch(0),
    debounceMs: 10,
    onSelect,
  });

  await userEvent.fill(screen.getByRole('combobox', { name: 'Taxon' }), 'rubus');
  await userEvent.click(screen.getByRole('option', { name: /Rubus fruticosus/ }));

  expect(onSelect).toHaveBeenCalledWith(TAXA[2]);
});

test('onQueryChange is called with the raw text on every keystroke', async () => {
  const onQueryChange = vi.fn();
  const screen = await render(ComboboxFormFixture, { items: TAXA, onQueryChange });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.click(input);
  await userEvent.keyboard('ro');

  expect(onQueryChange.mock.calls).toEqual([['r'], ['ro']]);
});

test('initialQuery seeds the input text', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA, initialQuery: 'rosa' });

  await expect.element(screen.getByRole('combobox', { name: 'Taxon' })).toHaveValue('rosa');
});

test("a selected item's label wins over initialQuery", async () => {
  const screen = await render(ComboboxFormFixture, {
    items: TAXA,
    value: 'rubus-fruticosus',
    initialQuery: 'rosa',
  });

  await expect
    .element(screen.getByRole('combobox', { name: 'Taxon' }))
    .toHaveValue('Rubus fruticosus');
});

test('inputClass lands on the input, after the defaults', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA, inputClass: 'join-item h-9' });

  const input = screen.getByRole('combobox', { name: 'Taxon' }).element();
  expect([...input.classList]).toEqual(expect.arrayContaining(['input', 'join-item', 'h-9']));
  expect(input.className.indexOf('join-item')).toBeGreaterThan(input.className.indexOf('input'));
});

test('hideLabel keeps the accessible name and hides the label visually', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA, hideLabel: true });

  await expect.element(screen.getByRole('combobox', { name: 'Taxon' })).toBeInTheDocument();
  expect(screen.container.querySelector('label')?.classList.contains('sr-only')).toBe(true);
});

test('native attributes such as data-testid reach the root', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA, testId: 'site-search' });

  const root = screen.getByTestId('site-search');
  await expect.element(root.getByRole('combobox', { name: 'Taxon' })).toBeInTheDocument();
});

test('the listbox is portalled out of the root by default', async () => {
  const screen = await render(ComboboxFormFixture, { items: TAXA, testId: 'site-search' });

  await userEvent.fill(screen.getByRole('combobox', { name: 'Taxon' }), 'rosa');
  await expect.element(screen.getByRole('listbox')).toBeInTheDocument();
  expect(screen.getByTestId('site-search').getByRole('option').elements()).toHaveLength(0);
});

test('portal={false} renders the listbox inside the root', async () => {
  const screen = await render(ComboboxFormFixture, {
    items: TAXA,
    testId: 'site-search',
    portal: false,
  });

  await userEvent.fill(screen.getByRole('combobox', { name: 'Taxon' }), 'rosa');
  const root = screen.getByTestId('site-search');
  await expect.element(root.getByRole('option', { name: /Rosa canina/ })).toBeInTheDocument();
  expect(root.getByRole('option').elements()).toHaveLength(2);
});

test('by default the form posts the selected id, not the typed text', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(ComboboxFormFixture, { items: TAXA, onSubmitted });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  expect(input.element().getAttribute('name')).toBeNull();
  await userEvent.fill(input, 'rosa');
  await userEvent.keyboard('{Enter}');
  await userEvent.click(screen.getByRole('button', { name: 'Search' }));

  expect(onSubmitted).toHaveBeenCalledTimes(1);
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.getAll('taxonId')).toEqual(['rosa-canina']);
});

test('postedValue="query" puts the name on the visible input and drops the hidden id input', async () => {
  const screen = await render(ComboboxFormFixture, {
    items: TAXA,
    name: 'query',
    postedValue: 'query',
    initialQuery: 'rosa',
  });

  // The server-rendered input itself is the posted control, which is what
  // keeps a plain GET search form working with JavaScript off.
  const input = screen.getByRole('combobox', { name: 'Taxon' }).element() as HTMLInputElement;
  expect(input.name).toBe('query');
  expect(input.value).toBe('rosa');
  expect(screen.container.querySelectorAll('input[type="hidden"]')).toHaveLength(0);
});

test('postedValue="query": Enter submits the typed text even with an auto-highlighted match', async () => {
  const onSubmitted = vi.fn();
  const onSelect = vi.fn();
  const screen = await render(ComboboxFormFixture, {
    items: TAXA,
    name: 'query',
    postedValue: 'query',
    onSubmitted,
    onSelect,
  });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'rosa');
  // bits-ui has put its cursor on the first match by itself …
  const first = screen.getByRole('option', { name: /Rosa canina/ }).element();
  await expect.element(input).toHaveAttribute('aria-activedescendant', first.id);

  // … which in query mode is not a choice: Enter searches for the text.
  await userEvent.keyboard('{Enter}');

  expect(onSubmitted).toHaveBeenCalledTimes(1);
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.getAll('query')).toEqual(['rosa']);
  expect(onSelect).not.toHaveBeenCalled();
  await expect.element(screen.getByTestId('selected')).toHaveTextContent('none');
});

test('postedValue="query": Enter after arrowing to an option commits it instead', async () => {
  const onSubmitted = vi.fn();
  const onSelect = vi.fn();
  const screen = await render(ComboboxFormFixture, {
    items: TAXA,
    name: 'query',
    postedValue: 'query',
    onSubmitted,
    onSelect,
  });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'rosa');
  await expect.element(screen.getByRole('option', { name: /Rosa rugosa/ })).toBeInTheDocument();

  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('{Enter}');

  expect(onSubmitted).not.toHaveBeenCalled();
  expect(onSelect).toHaveBeenCalledWith(TAXA[1]);
  await expect.element(screen.getByTestId('selected')).toHaveTextContent('rosa-rugosa');
});

test('postedValue="query": typing again after arrowing forgets the navigation', async () => {
  const onSubmitted = vi.fn();
  const screen = await render(ComboboxFormFixture, {
    items: TAXA,
    name: 'query',
    postedValue: 'query',
    onSubmitted,
  });

  const input = screen.getByRole('combobox', { name: 'Taxon' });
  await userEvent.fill(input, 'ro');
  await expect.element(screen.getByRole('option', { name: /Rosa rugosa/ })).toBeInTheDocument();
  await userEvent.keyboard('{ArrowDown}');
  await userEvent.keyboard('sa');
  await userEvent.keyboard('{Enter}');

  expect(onSubmitted).toHaveBeenCalledTimes(1);
  const data = onSubmitted.mock.calls[0]?.[0] as FormData;
  expect(data.getAll('query')).toEqual(['rosa']);
});
