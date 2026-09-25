import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Heading from '../../src/lib/ui/Heading.svelte';
import { htmlSnippet } from './snippets.ts';

test('renders a real heading at the level asked for', async () => {
  const screen = await render(Heading, { level: 3, children: 'Growing conditions' });

  await expect
    .element(screen.getByRole('heading', { level: 3, name: 'Growing conditions' }))
    .toBeInTheDocument();
});

test('derives the id from string children at render, not after mount', async () => {
  const screen = await render(Heading, { level: 2, children: 'Growing conditions & care' });

  await expect
    .element(screen.getByRole('heading'))
    .toHaveAttribute('id', 'growing-conditions-care');
});

test('an explicit id wins', async () => {
  const screen = await render(Heading, { level: 2, id: 'care', children: 'Growing conditions' });

  await expect.element(screen.getByRole('heading')).toHaveAttribute('id', 'care');
});

test('the anchor is a link to the heading with a real name', async () => {
  // `anchor` is also one of Svelte's own render options, so the props have to
  // be nested rather than passed at the top level.
  const screen = await render(Heading, {
    props: {
      level: 2,
      anchor: true,
      anchorLabel: 'Link to this section',
      children: 'Growing conditions',
    },
  });

  await expect
    .element(screen.getByRole('link', { name: 'Link to this section' }))
    .toHaveAttribute('href', '#growing-conditions');
});

test('a snippet heading with no id renders no anchor rather than a dead one', async () => {
  const screen = await render(Heading, {
    props: { level: 2, anchor: true, children: htmlSnippet('<em>Rosa canina</em>') },
  });

  await expect.element(screen.getByRole('heading')).not.toHaveAttribute('id');
  expect(screen.getByRole('link').elements()).toHaveLength(0);
});
