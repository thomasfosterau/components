import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import SwapFixture from './fixtures/SwapFixture.svelte';

type Props = Parameters<typeof render<typeof SwapFixture>>[1];

/** Render one swap and return its root, scoped to this render's container. */
const swapOf = async (props: Props = {}): Promise<HTMLElement> => {
  const screen = await render(SwapFixture, props);
  const root = screen.container.querySelector('[data-testid="swap"]');
  if (!(root instanceof HTMLElement)) throw new TypeError('no swap rendered');
  return root;
};

test('is aria-hidden, with no role or name of its own', async () => {
  const root = await swapOf();

  expect(root.getAttribute('aria-hidden')).toBe('true');
  expect(root.hasAttribute('role')).toBe(false);
  expect(root.querySelector('button, a, input, [tabindex]')).toBeNull();
});

test('active drives swap-active, and each face sits in its daisyUI slot', async () => {
  const off = await swapOf({ active: false });
  expect(off.classList.contains('swap-active')).toBe(false);
  expect(off.querySelector('.swap-off')?.textContent).toBe('Play');
  expect(off.querySelector('.swap-on')?.textContent).toBe('Pause');

  const on = await swapOf({ active: true });
  expect(on.classList.contains('swap-active')).toBe(true);
});

test('effect maps to the daisyUI transition class', async () => {
  expect((await swapOf({ effect: 'rotate' })).classList.contains('swap-rotate')).toBe(true);
  expect((await swapOf({ effect: 'flip' })).classList.contains('swap-flip')).toBe(true);
  expect((await swapOf()).className.trim()).toBe('swap');
});

test('indeterminate renders only its face, falling back to off', async () => {
  expect((await swapOf({ active: 'indeterminate', withIndeterminate: true })).textContent).toBe(
    'Some',
  );
  expect((await swapOf({ active: 'indeterminate' })).textContent).toBe('Play');
});
