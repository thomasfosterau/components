/**
 * `Fits` — the first layout that fits its container is the only one in the
 * accessibility tree; the others are `display: none`.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import PrimitivesFixture from './fixtures/PrimitivesFixture.svelte';

const shown = async (width: number): Promise<string[]> => {
  const screen = await render(PrimitivesFixture, { kind: 'fits', width });
  const visible = ['row', 'column', 'menu'].filter(
    (id) =>
      getComputedStyle(screen.getByTestId(id).element().parentElement as Element).display !==
      'none',
  );
  // One copy of each control in the accessibility tree.
  expect(screen.getByRole('button', { name: 'Save' }).elements()).toHaveLength(1);
  screen.unmount();
  return visible;
};

test('900px shows the first layout, 600px the second, 300px the last', async () => {
  expect(await shown(900)).toEqual(['row']);
  expect(await shown(600)).toEqual(['column']);
  expect(await shown(300)).toEqual(['menu']);
});
