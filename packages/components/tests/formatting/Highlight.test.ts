import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Highlight, { tokenise } from '../../src/lib/formatting/Highlight.svelte';

test('wraps a single match in <mark>', async () => {
  const screen = await render(Highlight, {
    text: 'The quick brown fox',
    query: 'fox',
  });

  const mark = screen.container.querySelector('mark');
  expect(mark?.textContent).toBe('fox');
  expect(screen.container.textContent).toBe('The quick brown fox');
});

test('is case-insensitive and highlights multiple tokens', async () => {
  const screen = await render(Highlight, {
    text: 'Gardening in Australia',
    query: 'GARDENING australia',
  });

  const marks = screen.container.querySelectorAll('mark');
  expect(Array.from(marks).map((m) => m.textContent)).toEqual(['Gardening', 'Australia']);
});

test('renders plain text with no <mark> when the query is empty', async () => {
  const screen = await render(Highlight, {
    text: 'The quick brown fox',
    query: '',
  });

  expect(screen.container.querySelector('mark')).toBeNull();
  expect(screen.container.textContent).toBe('The quick brown fox');
});

test('tokenise splits on regex-metacharacter-safe tokens and marks parity', () => {
  const segments = tokenise('a (b) c', '(b)');
  expect(segments).toEqual([
    { text: 'a ', match: false },
    { text: '(b)', match: true },
    { text: ' c', match: false },
  ]);
});
