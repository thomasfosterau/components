import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import InfoboxSection from '../../src/lib/infobox/InfoboxSection.svelte';
import { htmlSnippet } from './snippets.ts';

const rows = htmlSnippet('<div><dt>Family</dt><dd>Solanaceae</dd></div>');

test('owns the <dl>, with rows rendering dt/dd pairs inside it', async () => {
  const screen = await render(InfoboxSection, { children: rows });

  const dl = screen.container.querySelector('dl');
  expect(dl).not.toBeNull();
  expect(dl?.querySelector('dt')?.textContent).toBe('Family');
  expect(dl?.querySelector('dd')?.textContent).toBe('Solanaceae');
});

test('renders a titled group as a real heading, above the dl', async () => {
  const screen = await render(InfoboxSection, { title: 'Classification', children: rows });

  await expect.element(screen.getByRole('heading', { name: 'Classification' })).toBeInTheDocument();
});

test('omits the heading entirely for an untitled section', async () => {
  const screen = await render(InfoboxSection, { children: rows });

  expect(screen.container.querySelector('h4')).toBeNull();
});

test('spreads native attributes and merges class onto the dl', async () => {
  const screen = await render(InfoboxSection, {
    children: rows,
    class: 'my-section',
    'data-testid': 'section-dl',
  });

  const dl = screen.getByTestId('section-dl');
  await expect.element(dl).toHaveClass('my-section');
  await expect.element(dl).toHaveClass('divide-y');
});
