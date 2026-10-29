/**
 * `VStack` / `HStack` / `Cluster` / `Spacer` — token classes from the
 * literal tables, list semantics restored on `ul` / `ol`, dividers between
 * children only, and no reversing.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PrimitivesFixture from './fixtures/PrimitivesFixture.svelte';

test('VStack is a flex column with the default md gap; class merges last', async () => {
  const screen = await render(PrimitivesFixture, { kind: 'vstack' });

  const root = screen.getByTestId('root').element();
  expect(root.className).toBe('flex flex-col gap-4 p-1');
  expect(getComputedStyle(root).flexDirection).toBe('column');
});

test('HStack is a row; responsive is a column below sm', async () => {
  const row = await render(PrimitivesFixture, { kind: 'hstack', gap: 'lg' });
  expect(row.getByTestId('root').element().className).toBe('flex flex-row gap-8');
  row.unmount();

  const responsive = await render(PrimitivesFixture, { kind: 'hstack', responsive: true });
  expect(responsive.getByTestId('root').element().className).toContain('flex-col sm:flex-row');
});

test('as="ul" renders a list with role="list" and no bullets', async () => {
  const screen = await render(PrimitivesFixture, { kind: 'vstack', as: 'ul' });

  const list = screen.getByRole('list');
  expect(list.element().tagName).toBe('UL');
  expect(list.element().getAttribute('role')).toBe('list');
  expect(list.getByRole('listitem').elements()).toHaveLength(3);
});

test('divider rules sit between children, never around them', async () => {
  const screen = await render(PrimitivesFixture, { kind: 'vstack', divider: true });

  const children = [...screen.getByTestId('root').element().children] as HTMLElement[];
  const borders = children.map((child) => {
    const style = getComputedStyle(child);
    return [style.borderTopWidth, style.borderBottomWidth];
  });
  // Tailwind 4's divide-y: a rule under every child but the last, none above.
  expect(borders).toEqual([
    ['0px', '1px'],
    ['0px', '1px'],
    ['0px', '0px'],
  ]);
});

test('Cluster wraps with a gap and centres by default', async () => {
  const screen = await render(PrimitivesFixture, { kind: 'cluster', gap: 'xs', as: 'ol' });

  const root = screen.getByRole('list').element();
  expect(root.className).toBe('flex flex-wrap gap-1 items-center list-none');
});

test('Spacer pushes what follows to the far end and is hidden', async () => {
  const screen = await render(PrimitivesFixture, { kind: 'spacer', width: 600 });

  const root = screen.getByTestId('root').element();
  const spacer = root.querySelector('[aria-hidden="true"]') as HTMLElement;
  expect(spacer.className).toBe('flex-1');
  const next = screen.getByRole('button', { name: 'Next' }).element().getBoundingClientRect();
  expect(Math.round(next.right)).toBe(Math.round(root.getBoundingClientRect().right));
});
