import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Footnote from '../../src/lib/citations/Footnote.svelte';

test('renders its marker on the first paint, not after an effect', async () => {
  const screen = await render(Footnote, {
    id: 'note-1',
    content: 'Collected from a garden escape.',
  });
  await expect.element(screen.getByRole('link')).toHaveTextContent('1');
});

test('renders a custom symbol in place of the number', async () => {
  const screen = await render(Footnote, { id: 'note-2', content: 'See also.', symbol: '†' });
  await expect.element(screen.getByRole('link')).toHaveTextContent('†');
});

test('carries a default accessible name naming the note', async () => {
  const screen = await render(Footnote, {
    id: 'note-3',
    content: 'Collected from a garden escape.',
  });
  await expect
    .element(screen.getByRole('link'))
    .toHaveAccessibleName('Footnote 1: Collected from a garden escape.');
});

test('accepts a caller-supplied accessible label', async () => {
  const screen = await render(Footnote, {
    id: 'note-4',
    content: 'See also.',
    footnoteLabel: (marker, content) => `Remarque ${marker} : ${content}`,
  });
  await expect.element(screen.getByRole('link')).toHaveAccessibleName('Remarque 1 : See also.');
});
