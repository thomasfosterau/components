import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import NavigationProgress from '../../src/lib/feedback/NavigationProgress.svelte';
import {
  createNavigationProgress,
  type NavigationProgressApi,
} from '../../src/lib/feedback/navigation-progress.svelte.ts';
import NavigationProgressContextFixture from './fixtures/NavigationProgressContextFixture.svelte';

const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

afterEach(() => {
  vi.restoreAllMocks();
});

test('an operation shorter than the delay never shows the bar', async () => {
  const progress = createNavigationProgress();
  const screen = await render(NavigationProgress, { progress });

  progress.start();
  await wait(50);
  progress.done();
  await wait(250);

  expect(screen.getByRole('progressbar').elements()).toHaveLength(0);
});

test('a longer one shows an indeterminate bar, which completes and is removed', async () => {
  const progress = createNavigationProgress();
  const screen = await render(NavigationProgress, { progress });

  progress.start();
  const bar = screen.getByRole('progressbar', { name: 'Loading page' });
  await expect.element(bar).toBeInTheDocument();
  await expect.element(bar).not.toHaveAttribute('aria-valuenow');

  progress.done();
  await expect.poll(() => bar.element().querySelector('div')?.style.transform).toBe('scaleX(1)');
  await expect.poll(() => screen.getByRole('progressbar').elements()).toHaveLength(0);
});

test('set reports a real percentage', async () => {
  const progress = createNavigationProgress();
  const screen = await render(NavigationProgress, { progress, delay: 0 });

  progress.set(0.4);

  await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
  progress.increment(0.25);
  await expect.element(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '65');
});

test('concurrent operations are counted: the bar completes after the last done', () => {
  const progress = createNavigationProgress();

  progress.start();
  progress.start();
  progress.done();
  expect(progress.active).toBe(true);
  progress.done();
  expect(progress.active).toBe(false);
  progress.done();
  progress.start();
  expect(progress.active).toBe(true);
});

test('a long wait is announced once, and loadedLabel at the end', async () => {
  const progress = createNavigationProgress();
  const screen = await render(NavigationProgress, {
    progress,
    delay: 0,
    loadedLabel: 'Page loaded',
  });

  progress.start();
  const status = screen.getByRole('status');
  await expect.element(status).toHaveTextContent('');
  await expect.poll(() => status.element().textContent, { timeout: 2000 }).toBe('Loading');
  progress.done();
  await expect.element(status).toHaveTextContent('Page loaded');
});

test('a short wait announces nothing', async () => {
  const progress = createNavigationProgress();
  const screen = await render(NavigationProgress, {
    progress,
    delay: 0,
    loadedLabel: 'Page loaded',
  });

  progress.start();
  await wait(300);
  progress.done();
  await wait(100);

  expect(screen.getByRole('status').element().textContent).toBe('');
});

test('under reduced motion the bar sits at 30% with no transition', async () => {
  const original = window.matchMedia.bind(window);
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => {
    const list = original(query);
    if (!query.includes('prefers-reduced-motion')) return list;
    return Object.defineProperty(list, 'matches', { value: true });
  });
  const progress = createNavigationProgress();
  const screen = await render(NavigationProgress, { progress, delay: 0 });

  progress.start();
  await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
  await wait(600);
  const fill = screen.getByRole('progressbar').element().querySelector('div');

  expect(fill).not.toBeNull();
  if (fill === null) return;
  expect(getComputedStyle(fill).transitionDuration).toBe('0s');
  expect(fill.style.transform).toBe('scaleX(0.3)');
});

test('without a progress prop it draws the store setNavigationProgress published', async () => {
  let api: NavigationProgressApi | undefined;
  const screen = await render(NavigationProgressContextFixture, {
    onReady: (published: NavigationProgressApi) => {
      api = published;
    },
  });

  api?.start();
  await expect.element(screen.getByRole('progressbar')).toBeInTheDocument();
});
