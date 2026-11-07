/**
 * `CodeBlock`'s contract: the code is text (never markup), prefixes are
 * daisyUI's per-line `data-prefix`, the copy button copies `code` exactly, a
 * caption names a figure, and the scroller is a focusable region only while
 * it overflows.
 */

import { userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import CodeBlock from '../../src/lib/ui/CodeBlock.svelte';

afterEach(() => {
  Reflect.deleteProperty(navigator, 'clipboard');
});

test('renders the code as text inside a code element', async () => {
  const screen = await render(CodeBlock, { code: '<Button>Save</Button>', language: 'svelte' });

  const code = screen.getByText('<Button>Save</Button>');
  await expect.element(code).toBeInTheDocument();
  expect(code.element().tagName).toBe('CODE');
  await expect.element(code).toHaveClass('language-svelte');
});

test('prefix="numbers" draws one pre per line, numbered', async () => {
  await render(CodeBlock, { code: 'a\nb\nc', prefix: 'numbers' });

  const prefixes = [...document.querySelectorAll('.mockup-code pre')].map((pre) =>
    pre.getAttribute('data-prefix'),
  );
  expect(prefixes).toEqual(['1', '2', '3']);
});

test('the copy button copies the code exactly, prefixes excluded', async () => {
  const writeText = vi.fn<(text: string) => Promise<void>>(() => Promise.resolve());
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  const screen = await render(CodeBlock, { code: 'pnpm install\npnpm test', prefix: '$' });

  await userEvent.click(screen.getByRole('button', { name: 'Copy code' }));

  expect(writeText).toHaveBeenCalledWith('pnpm install\npnpm test');
});

test('a caption makes it a figure named by the caption', async () => {
  const screen = await render(CodeBlock, { code: 'export default {};', caption: 'vite.config.ts' });

  await expect.element(screen.getByRole('figure', { name: 'vite.config.ts' })).toBeInTheDocument();
});

test('only an overflowing block is a focusable region', async () => {
  const short = await render(CodeBlock, { code: 'ok', style: 'width: 400px' });
  expect(short.getByRole('region').elements()).toHaveLength(0);
  await short.unmount();

  const long = await render(CodeBlock, {
    code: 'x'.repeat(400),
    language: 'ts',
    style: 'width: 200px',
  });
  const region = long.getByRole('region', { name: 'ts code' });
  await expect.element(region).toHaveAttribute('tabindex', '0');
});
