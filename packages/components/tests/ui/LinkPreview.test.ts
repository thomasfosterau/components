import { userEvent } from 'vite-plus/test/browser';
import { expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import LinkPreviewFixture from './fixtures/LinkPreviewFixture.svelte';

const card = (): Element | undefined =>
  [...document.querySelectorAll('[data-link-preview-content]')].find((element) =>
    element.textContent?.includes('rose'),
  );

let resolveLoad: (value: string) => void = () => {};
const pendingLoad = (): Promise<string> =>
  new Promise((done) => {
    resolveLoad = done;
  });

test('the link keeps its name and href, without button or popup semantics', async () => {
  const screen = await render(LinkPreviewFixture);

  const link = screen.getByRole('link', { name: 'Rosa canina' });
  await expect.element(link).toHaveAttribute('href', '/taxa/rosa-canina');
  for (const attribute of ['role', 'aria-haspopup', 'aria-expanded', 'aria-controls']) {
    expect(link.element().hasAttribute(attribute)).toBe(false);
  }
});

test('keyboard focus opens the card; Escape closes it and the link keeps focus', async () => {
  const screen = await render(LinkPreviewFixture);
  screen.getByRole('button', { name: 'Before' }).element().focus();

  await userEvent.tab();
  const link = screen.getByRole('link', { name: 'Rosa canina' });
  await expect.element(link).toHaveFocus();
  await expect.poll(() => card()?.textContent).toContain('Dog rose.');

  await userEvent.keyboard('{Escape}');
  await expect.poll(card).toBeUndefined();
  await expect.element(link).toHaveFocus();
});

test('the card is not in the Tab order', async () => {
  const screen = await render(LinkPreviewFixture);
  screen.getByRole('button', { name: 'Before' }).element().focus();

  await userEvent.tab();
  await expect.poll(card).toBeDefined();
  await userEvent.tab();

  await expect.element(screen.getByRole('button', { name: 'After' })).toHaveFocus();
});

test('the focus a click gives does not open it', async () => {
  const screen = await render(LinkPreviewFixture, { openDelay: 10_000 });
  const link = screen.getByRole('link', { name: 'Rosa canina' });
  link.element().addEventListener('click', (event) => event.preventDefault());

  await link.click();
  await expect.element(link).toHaveFocus();
  await new Promise((resolve) => setTimeout(resolve, 200));

  expect(card()).toBeUndefined();
});

test('load runs once, shows a skeleton meanwhile, and keeps its result', async () => {
  const load = vi.fn<(signal: AbortSignal) => Promise<string>>(pendingLoad);
  const screen = await render(LinkPreviewFixture, { load });

  await screen.rerender({ open: true });
  await expect.element(screen.getByRole('status', { name: 'Loading preview' })).toBeInTheDocument();
  resolveLoad('Common in hedgerows.');
  await expect.poll(() => card()?.textContent).toContain('Common in hedgerows.');

  await screen.rerender({ open: false });
  await screen.rerender({ open: true });
  await expect.poll(() => card()?.textContent).toContain('Common in hedgerows.');
  expect(load).toHaveBeenCalledOnce();
});

test('closing before load settles aborts its signal', async () => {
  const signals: AbortSignal[] = [];
  const load = vi.fn<(signal: AbortSignal) => Promise<string>>((signal) => {
    signals.push(signal);
    return new Promise(() => {});
  });
  const screen = await render(LinkPreviewFixture, { load });

  await screen.rerender({ open: true });
  await expect.poll(() => signals.length).toBe(1);
  await screen.rerender({ open: false });

  await expect.poll(() => signals[0]?.aborted).toBe(true);
});
