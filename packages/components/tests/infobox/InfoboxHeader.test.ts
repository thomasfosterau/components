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

test('headingLevel changes only the tag, for a box that is a section of the page', async () => {
  const screen = await render(InfoboxHeader, { title: 'Key facts', headingLevel: 2 });

  const heading = screen.getByRole('heading', { level: 2, name: 'Key facts' });
  await expect.element(heading).toBeInTheDocument();
  expect(heading.element().tagName).toBe('H2');
  await expect.element(heading).toHaveClass('text-lg', 'font-bold');
  expect(screen.getByRole('heading', { level: 3 }).elements()).toHaveLength(0);
});
