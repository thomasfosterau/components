/**
 * `DescriptionList`'s contract: a real `<dl>` of `<dt>`/`<dd>` pairs — the
 * only thing that makes the label / value association exist — and the empty
 * rule, where a row with nothing in it renders nothing at all rather than an
 * empty `<dd>` claiming the page looked and found a blank.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import DescriptionListBareFixture from './fixtures/DescriptionListBareFixture.svelte';
import DescriptionListFixture from './fixtures/DescriptionListFixture.svelte';

const terms = (): string[] =>
  [...document.querySelectorAll('dt')].map((node) => node.textContent?.trim() ?? '');

const definitions = (): string[] =>
  [...document.querySelectorAll('dd')].map((node) => node.textContent?.trim() ?? '');

test('renders a dl whose dt/dd pairs match the rows that have values', async () => {
  const screen = await render(DescriptionListFixture);

  await expect.element(screen.getByText('Formula')).toBeInTheDocument();
  // "Collected" has an empty value, so its row is absent entirely.
  expect(terms()).toEqual(['Formula', 'Licence', 'Height']);
  expect(definitions()).toEqual(['C8H10N4O2', 'CC BY 4.0', '42']);
  expect(document.querySelector('dl')).not.toBeNull();
  expect(document.querySelectorAll('dt')).toHaveLength(document.querySelectorAll('dd').length);
});

test('showEmpty keeps the row and says what the absence is', async () => {
  await render(DescriptionListFixture, { showEmpty: true, emptyLabel: 'not recorded' });

  expect(terms()).toEqual(['Formula', 'Collected', 'Licence', 'Height']);
  expect(definitions()[1]).toBe('not recorded');
});

test('the list variant reaches the rows, and mono reaches the values', async () => {
  await render(DescriptionListFixture, { variant: 'card', mono: true });

  const list = document.querySelector('dl');
  expect(list).toHaveClass('card');
  // In `card` the pair are siblings directly in the list's grid, so the
  // two-column alignment the grid exists for survives.
  expect(document.querySelector('dt')?.parentElement).toBe(list);
  expect(document.querySelector('dd')).toHaveClass('font-mono');
});

test('every other variant wraps the pair so it stays together when rows wrap', async () => {
  await render(DescriptionListFixture, { variant: 'inline' });

  const list = document.querySelector('dl');
  expect(list).toHaveClass('flex');
  expect(document.querySelector('dt')?.parentElement).not.toBe(list);
  expect(document.querySelector('dt')?.parentElement?.tagName).toBe('DIV');
});

test('bare adds no layout and puts every dt/dd directly in the caller’s list', async () => {
  await render(DescriptionListFixture, {
    variant: 'bare',
    class: 'grid grid-cols-[auto_1fr]',
  });

  const list = document.querySelector('dl');
  // Only the caller's classes: none of the other variants' layout.
  expect(list?.className.split(/\s+/).filter(Boolean).sort()).toEqual([
    'grid',
    'grid-cols-[auto_1fr]',
  ]);
  expect(list?.querySelector('div')).toBeNull();
  expect([...(list?.children ?? [])].map((node) => node.tagName)).toEqual([
    'DT',
    'DD',
    'DT',
    'DD',
    'DT',
    'DD',
  ]);
  expect(terms()).toEqual(['Formula', 'Licence', 'Height']);
});

test('bare rows sit beside a caller’s own dt/dd pairs in its grid', async () => {
  await render(DescriptionListBareFixture);

  const list = document.querySelector('dl');
  expect(list).toHaveClass('grid', 'grid-cols-[auto_1fr]');
  expect([...(list?.children ?? [])].map((node) => node.tagName)).toEqual([
    'DT',
    'DD',
    'DT',
    'DD',
    'DT',
    'DD',
  ]);
  // The empty "Closed" row is still absent, bare or not.
  expect(terms()).toEqual(['Name', 'Founded', 'Website']);
  expect(definitions()).toEqual(['Royal Botanic Garden', '1816', 'example.org']);
});
