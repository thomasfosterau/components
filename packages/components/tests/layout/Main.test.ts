import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Main from '../../src/lib/layout/Main.svelte';
import { htmlSnippet } from './snippets.ts';

test('is the main landmark by default', async () => {
  const screen = await render(Main, { children: htmlSnippet('<p>Body copy</p>') });

  await expect.element(screen.getByRole('main')).toBeInTheDocument();
});

test('as="section" opens no second main landmark', async () => {
  const screen = await render(Main, {
    props: { as: 'section', children: htmlSnippet('<p>Body copy</p>') },
  });

  expect(screen.getByRole('main').elements()).toHaveLength(0);
  expect(screen.getByText('Body copy').element().closest('section')).not.toBeNull();
});

test('a named section is a region a reader can jump to', async () => {
  const screen = await render(Main, {
    props: {
      as: 'section',
      'aria-label': 'Recently watered',
      children: htmlSnippet('<p>Body copy</p>'),
    },
  });

  await expect
    .element(screen.getByRole('region', { name: 'Recently watered' }))
    .toBeInTheDocument();
});
