import { expect, test } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import TruncateFixture from './fixtures/TruncateFixture.svelte';

const FILE = 'IMG_20241012_153045_0412.jpg';

const visible = (container: HTMLElement): string =>
  container.querySelector('[aria-hidden="true"]')?.textContent ?? '';

test('the middle cut keeps both ends visible, with the full text for assistive technology', async () => {
  const screen = await render(TruncateFixture, { text: FILE, position: 'middle', width: 160 });

  await expect.poll(() => visible(screen.container)).toMatch(/^IMG_20.+….+\.jpg$/);
  await expect.element(screen.getByText(FILE)).toBeInTheDocument();
});

test('a wide container shows the whole text, with no tooltip', async () => {
  const screen = await render(TruncateFixture, { text: FILE, position: 'middle', width: 600 });

  await expect.poll(() => visible(screen.container)).toBe(FILE);
  await userEvent.hover(screen.getByText(FILE, { exact: true }).first());
  await new Promise((resolve) => setTimeout(resolve, 600));
  expect(document.querySelector('[data-tooltip-content]')).toBeNull();
});

test('narrowing the container cuts the text again', async () => {
  const screen = await render(TruncateFixture, { text: FILE, position: 'middle', width: 600 });
  await expect.poll(() => visible(screen.container)).toBe(FILE);

  await screen.rerender({ width: 160 });
  await expect.poll(() => visible(screen.container)).toContain('…');
});

test('copying the cut text copies the full text', async () => {
  const screen = await render(TruncateFixture, { text: FILE, position: 'middle', width: 160 });
  await expect.poll(() => visible(screen.container)).toContain('…');

  const shown = screen.container.querySelector('[aria-hidden="true"]');
  if (shown === null) throw new Error('no visible string');
  const range = document.createRange();
  range.selectNodeContents(shown);
  getSelection()?.removeAllRanges();
  getSelection()?.addRange(range);

  const data = new DataTransfer();
  shown.dispatchEvent(
    new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: data }),
  );
  expect(data.getData('text/plain')).toBe(FILE);
});

test('in a link, focus shows the full text in a tooltip only while it is cut', async () => {
  const cut = await render(TruncateFixture, { text: FILE, width: 80, link: true });
  cut.getByRole('link').element().focus();
  await expect.poll(() => document.querySelector('[data-tooltip-content]')?.textContent).toBe(FILE);
  await cut.unmount();
  await expect.poll(() => document.querySelector('[data-tooltip-content]')).toBeNull();

  const whole = await render(TruncateFixture, { text: 'beds.jpg', width: 600, link: true });
  whole.getByRole('link').element().focus();
  await new Promise((resolve) => setTimeout(resolve, 600));
  expect(document.querySelector('[data-tooltip-content]')).toBeNull();
});

test('the end cut leaves the text as the content, and the span is not a tab stop', async () => {
  const screen = await render(TruncateFixture, { text: FILE, width: 80 });

  const span = screen.getByText(FILE);
  await expect.element(span).toBeInTheDocument();
  expect(span.element().hasAttribute('tabindex')).toBe(false);
  expect(span.element().hasAttribute('aria-describedby')).toBe(false);
});
