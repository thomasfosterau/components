/**
 * `Stack` — only the top item is exposed; the rest are `inert` and
 * `aria-hidden`; the depth is read as "N items".
 */

import { userEvent } from 'vite-plus/test/browser';
import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import StackFixture from './fixtures/StackFixture.svelte';

test('only the top card’s link is exposed, and Tab never lands behind it', async () => {
  const screen = await render(StackFixture, {});

  expect(
    screen
      .getByRole('link')
      .elements()
      .map((link) => link.textContent),
  ).toEqual(['Tomato']);
  await screen.getByRole('button', { name: 'Before' }).click();
  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'Tomato' })).toHaveFocus();
  await userEvent.tab();
  await expect.element(screen.getByRole('button', { name: 'After' })).toHaveFocus();
});

test('items after the first are inert and aria-hidden', async () => {
  const screen = await render(StackFixture, {});

  const layers = [...screen.getByTestId('stack').element().children];
  expect(layers).toHaveLength(3);
  expect(layers[0]?.hasAttribute('inert')).toBe(false);
  for (const layer of layers.slice(1)) {
    expect(layer.hasAttribute('inert')).toBe(true);
    expect(layer.getAttribute('aria-hidden')).toBe('true');
  }
});

test('the top item reads the depth: three items, or the given count', async () => {
  const three = await render(StackFixture, {});
  expect(three.getByTestId('stack').element().children[0]?.textContent).toContain('3 items');
  three.unmount();

  const twelve = await render(StackFixture, { count: 12 });
  expect(twelve.getByTestId('stack').element().children[0]?.textContent).toContain('12 items');
});

test('a single item reads no count', async () => {
  const screen = await render(StackFixture, { names: ['Tomato'] });

  expect(screen.getByTestId('stack').element().textContent?.trim()).toBe('Tomato');
});

test('direction sets the daisyUI class; class merges last', async () => {
  const screen = await render(StackFixture, { direction: 'top' });

  const root = screen.getByTestId('stack').element();
  expect(root.classList.contains('stack-top')).toBe(true);
  expect([...root.classList].at(-1)).toBe('w-48');
});
