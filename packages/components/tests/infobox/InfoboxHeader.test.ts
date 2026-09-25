import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import InfoboxHeader from '../../src/lib/infobox/InfoboxHeader.svelte';

test('titles the box with an h3, below an article’s own headings', async () => {
  const screen = await render(InfoboxHeader, { title: 'Solanum lycopersicum', subtitle: 'Tomato' });

  await expect
    .element(screen.getByRole('heading', { level: 3, name: 'Solanum lycopersicum' }))
    .toBeInTheDocument();
  await expect.element(screen.getByText('Tomato')).toBeInTheDocument();
});

test('omits an empty subtitle rather than rendering a blank line', async () => {
  const screen = await render(InfoboxHeader, { title: 'Bed 3', subtitle: '' });

  await expect.element(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Bed 3');
  expect(screen.container.querySelector('p')).toBeNull();
});

test('spreads native attributes and merges class', async () => {
  const screen = await render(InfoboxHeader, {
    title: 'Bed 3',
    class: 'my-header',
    'data-testid': 'header',
  });

  const element = screen.getByTestId('header');
  await expect.element(element).toHaveClass('my-header');
});
