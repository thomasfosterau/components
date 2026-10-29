/**
 * `Grid` — columns come from the narrowest an item may get, not from the
 * viewport: the container's width decides the count.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PrimitivesFixture from './fixtures/PrimitivesFixture.svelte';

const columns = (element: Element): number =>
  getComputedStyle(element).gridTemplateColumns.split(' ').length;

test('minItem="sm" (12rem) gives four columns in 900px and two in 420px', async () => {
  const wide = await render(PrimitivesFixture, { kind: 'grid', minItem: 'sm', gap: 'none' });
  expect(columns(wide.getByTestId('root').element())).toBe(4);
  wide.unmount();

  const narrow = await render(PrimitivesFixture, {
    kind: 'grid',
    minItem: 'sm',
    gap: 'none',
    width: 420,
  });
  expect(columns(narrow.getByTestId('root').element())).toBe(2);
});

test('an item never overflows a container narrower than minItem', async () => {
  const screen = await render(PrimitivesFixture, { kind: 'grid', minItem: 'lg', width: 200 });

  const root = screen.getByTestId('root').element();
  expect(columns(root)).toBe(1);
  expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
});

test('as="ul" restores list semantics', async () => {
  const screen = await render(PrimitivesFixture, { kind: 'grid', as: 'ul' });

  expect(screen.getByTestId('root').element().getAttribute('role')).toBe('list');
});
