import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import FormatListConjunction from './fixtures/FormatListConjunction.svelte';

test('renders each item through the snippet with locale conjunction text (en-AU)', async () => {
  const screen = await render(FormatListConjunction, {
    items: ['tomatoes', 'basil', 'garlic'],
    locales: 'en-AU',
  });

  const expected = new Intl.ListFormat('en-AU', { style: 'long', type: 'conjunction' }).format([
    'tomatoes',
    'basil',
    'garlic',
  ]);
  await expect.element(screen.getByText('tomatoes')).toBeInTheDocument();
  await expect.element(screen.getByText('garlic')).toBeInTheDocument();
  expect(screen.container.textContent?.trim()).toBe(expected);
});

test('formats a disjunction in de-DE', async () => {
  const screen = await render(FormatListConjunction, {
    items: ['Frühling', 'Sommer'],
    locales: 'de-DE',
    type: 'disjunction',
  });

  const expected = new Intl.ListFormat('de-DE', { style: 'long', type: 'disjunction' }).format([
    'Frühling',
    'Sommer',
  ]);
  expect(screen.container.textContent?.trim()).toBe(expected);
});

test('renders a single item with no separator', async () => {
  const screen = await render(FormatListConjunction, {
    items: ['tomatoes'],
    locales: 'en-AU',
  });

  await expect.element(screen.getByText('tomatoes')).toBeInTheDocument();
});

test('short style abbreviates the list', async () => {
  const screen = await render(FormatListConjunction, {
    items: ['NSW', 'VIC', 'QLD'],
    locales: 'en-AU',
    style: 'short',
  });

  const expected = new Intl.ListFormat('en-AU', { style: 'short', type: 'conjunction' }).format([
    'NSW',
    'VIC',
    'QLD',
  ]);
  expect(screen.container.textContent?.trim()).toBe(expected);
});
