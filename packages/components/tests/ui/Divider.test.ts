import { expect, test } from 'vite-plus/test';
import { createRawSnippet } from 'svelte';
import { render } from 'vitest-browser-svelte';
import Divider from '../../src/lib/ui/Divider.svelte';

const or = createRawSnippet(() => ({ render: () => '<span>or</span>' }));

test('is a separator, horizontal by default (no aria-orientation)', async () => {
  const screen = await render(Divider, {});

  const separator = screen.getByRole('separator');
  await expect.element(separator).toBeInTheDocument();
  await expect.element(separator).not.toHaveAttribute('aria-orientation');
  await expect.element(separator).toHaveClass('divider', 'divider-vertical');
});

test('orientation="vertical" says so, and uses daisyUI\'s side-by-side class', async () => {
  const screen = await render(Divider, { orientation: 'vertical' });

  const separator = screen.getByRole('separator');
  await expect.element(separator).toHaveAttribute('aria-orientation', 'vertical');
  await expect.element(separator).toHaveClass('divider-horizontal');
});

test('decorative is hidden and announces nothing', async () => {
  const screen = await render(Divider, { decorative: true, 'data-testid': 'rule' });

  expect(screen.getByRole('separator').elements()).toHaveLength(0);
  await expect.element(screen.getByTestId('rule')).toHaveAttribute('aria-hidden', 'true');
});

test('a label reads in flow instead of being swallowed by a separator', async () => {
  const screen = await render(Divider, { children: or, align: 'start' });

  await expect.element(screen.getByText('or')).toBeVisible();
  expect(screen.getByRole('separator').elements()).toHaveLength(0);
  const text = screen.getByText('or').element();
  expect(text.closest('[aria-hidden="true"]')).toBeNull();
  expect(text.closest('.divider')?.classList.contains('divider-start')).toBe(true);
});

test("tone adds its class and the caller's class comes last", async () => {
  const screen = await render(Divider, { tone: 'primary', class: 'my-8' });

  const separator = screen.getByRole('separator').element();
  expect(separator.classList.contains('divider-primary')).toBe(true);
  expect([...separator.classList].at(-1)).toBe('my-8');
});
