import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SearchForm from '../../src/lib/forms/SearchForm.svelte';

test('is a <search> landmark around a GET form', async () => {
  const screen = await render(SearchForm, { action: '/search' });

  // Asserted as an element rather than through `getByRole('search')`: the
  // locator engine bundled with this Vitest does not yet map the `<search>`
  // element to its implicit landmark role, though Chromium's own
  // accessibility tree does.
  const landmark = screen.container.querySelector('search');
  expect(landmark).not.toBeNull();

  const form = landmark?.querySelector('form');
  expect(form?.getAttribute('method')).toBe('get');
  expect(form?.getAttribute('action')).toBe('/search');
});

test('the field has a real, visually hidden label — not a placeholder for a name', async () => {
  const screen = await render(SearchForm, { action: '/search', label: 'Search taxa' });

  const input = screen.getByRole('searchbox', { name: 'Search taxa' });
  await expect.element(input).toBeInTheDocument();

  const label = screen.container.querySelector('label');
  expect(label?.className).toContain('sr-only');
  expect(label?.getAttribute('for')).toBe(input.element().id);
});

test('the query parameter is named, defaulted, and accepts typing', async () => {
  const screen = await render(SearchForm, { action: '/search', name: 'query' });

  const input = screen.getByRole('searchbox');
  await expect.element(input).toHaveAttribute('name', 'query');

  await userEvent.fill(input, 'rosa');
  await expect.element(input).toHaveValue('rosa');
});

test('the submit control carries its own text', async () => {
  const screen = await render(SearchForm, { action: '/search', submitLabel: 'Find' });

  await expect.element(screen.getByRole('button', { name: 'Find' })).toBeInTheDocument();
});

test('an empty query is refused by the platform, with no script', async () => {
  const screen = await render(SearchForm, { action: '/search' });

  await expect.element(screen.getByRole('searchbox')).toBeRequired();
});
