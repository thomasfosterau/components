import { expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { createRawSnippet } from 'svelte';
import Figure from '../../src/lib/media/Figure.svelte';
import FigureWithSnippetCaption from './fixtures/FigureWithSnippetCaption.svelte';

const children = createRawSnippet(() => ({
  render: () => '<img src="https://example.com/garden.jpg" alt="A garden bed" />',
}));

test('renders a string caption as <figcaption>', async () => {
  const screen = await render(Figure, {
    caption: 'A row of tomato seedlings',
    children,
  });

  const figure = screen.container.querySelector('figure');
  expect(figure).not.toBeNull();
  const figcaption = figure?.querySelector('figcaption');
  expect(figcaption?.textContent).toBe('A row of tomato seedlings');
  await expect.element(screen.getByRole('img', { name: 'A garden bed' })).toBeInTheDocument();
});

test('renders no <figcaption> when caption is absent', async () => {
  const screen = await render(Figure, { children });

  expect(screen.container.querySelector('figcaption')).toBeNull();
});

test('renders a snippet caption', async () => {
  const screen = await render(FigureWithSnippetCaption);

  const figcaption = screen.container.querySelector('figcaption');
  expect(figcaption?.querySelector('em')?.textContent).toBe('Thomas Foster');
  expect(figcaption?.textContent?.trim()).toBe('Photo: Thomas Foster');
});

test('spreads native attributes and merges class', async () => {
  const screen = await render(Figure, {
    children,
    class: 'my-figure',
    'data-testid': 'fig',
  });

  const element = screen.getByTestId('fig');
  await expect.element(element).toHaveClass('my-figure');
});
