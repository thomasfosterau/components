import { afterEach, expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import BackToTopPage from './fixtures/BackToTopPage.svelte';

afterEach(() => {
  vi.restoreAllMocks();
  window.scrollTo({ top: 0, behavior: 'instant' });
});

/** Make `prefers-reduced-motion: reduce` match (or not) for this test. */
const reduceMotion = (reduce: boolean): void => {
  const original = window.matchMedia.bind(window);
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...original(query),
    matches: query.includes('prefers-reduced-motion') ? reduce : original(query).matches,
  }));
};

test('at the top of the page it is out of the accessibility tree; past the threshold it appears', async () => {
  const screen = await render(BackToTopPage);
  const link = screen.getByRole('link', { name: 'Back to top', includeHidden: true });

  await expect.element(link).toHaveAttribute('hidden');
  expect(screen.getByRole('link', { name: 'Back to top' }).query()).toBeNull();

  window.scrollTo({ top: 1000, behavior: 'instant' });
  await expect.element(screen.getByRole('link', { name: 'Back to top' })).toBeVisible();
  await expect.element(link).toHaveAttribute('href', '#main-content');
  await expect.element(link).not.toHaveAttribute('hidden');

  window.scrollTo({ top: 0, behavior: 'instant' });
  await expect.element(link).toHaveAttribute('hidden');
});

test('activating it scrolls to the top and moves focus to main, so the next Tab continues there', async () => {
  const screen = await render(BackToTopPage);
  window.scrollTo({ top: 1000, behavior: 'instant' });
  const link = screen.getByRole('link', { name: 'Back to top' });
  await expect.element(link).toBeVisible();

  await userEvent.click(link);
  await expect.poll(() => window.scrollY).toBeLessThan(2);
  const main = screen.getByRole('main');
  await expect.element(main).toHaveFocus();
  await expect.element(main).toHaveAttribute('tabindex', '-1');
  // The fragment is not written into the URL: the script handled the jump.
  expect(window.location.hash).toBe('');

  await userEvent.tab();
  await expect.element(screen.getByRole('link', { name: 'First link in main' })).toHaveFocus();
  await expect.element(main).not.toHaveAttribute('tabindex');
});

test('it scrolls smoothly, or instantly under prefers-reduced-motion', async () => {
  reduceMotion(true);
  const scrollTo = vi.spyOn(window, 'scrollTo');
  const screen = await render(BackToTopPage);
  window.scrollTo({ top: 1000, behavior: 'instant' });
  const link = screen.getByRole('link', { name: 'Back to top' });
  await userEvent.click(link);
  expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, behavior: 'auto' });

  vi.restoreAllMocks();
  reduceMotion(false);
  const smooth = vi.spyOn(window, 'scrollTo');
  window.scrollTo({ top: 1000, behavior: 'instant' });
  await expect.element(link).toBeVisible();
  await userEvent.click(link);
  expect(smooth).toHaveBeenLastCalledWith({ top: 0, behavior: 'smooth' });
});

test('with scrollContainer it watches and scrolls that container, not the window', async () => {
  reduceMotion(true);
  const windowScroll = vi.spyOn(window, 'scrollTo');
  const screen = await render(BackToTopPage, { contained: true });
  const scroller = screen.getByTestId('scroller').element();
  const link = screen.getByRole('link', { name: 'Back to top', includeHidden: true });
  await expect.element(link).toHaveAttribute('hidden');

  scroller.scrollTop = 1000;
  await expect.element(link).toBeVisible();
  await userEvent.click(link);

  await expect.poll(() => scroller.scrollTop).toBe(0);
  expect(windowScroll).not.toHaveBeenCalled();
  await expect.element(screen.getByRole('region', { name: 'Account' })).toHaveFocus();
});

test('the floating variant is the same link', async () => {
  const screen = await render(BackToTopPage, { variant: 'floating' });
  window.scrollTo({ top: 1000, behavior: 'instant' });
  const link = screen.getByRole('link', { name: 'Back to top' });
  await expect.element(link).toBeVisible();
  await expect.element(link).toHaveClass('btn', 'fixed');
});
