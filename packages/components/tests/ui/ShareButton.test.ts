import { userEvent } from 'vite-plus/test/browser';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ShareButton from '../../src/lib/ui/ShareButton.svelte';

/**
 * Headless Chromium has no Web Share API, which is the interesting case as
 * well as the default one: the component must render NOTHING. The share path
 * is exercised by installing the API on `navigator` for the test — a spy, not
 * a real sheet, which would need a user gesture and a platform dialog.
 */
const installShare = (share: (data: ShareData) => Promise<void>, canShare?: boolean): void => {
  Object.defineProperty(navigator, 'share', { value: share, configurable: true });
  if (canShare !== undefined) {
    Object.defineProperty(navigator, 'canShare', { value: () => canShare, configurable: true });
  }
};

afterEach(() => {
  Reflect.deleteProperty(navigator, 'share');
  Reflect.deleteProperty(navigator, 'canShare');
});

test('renders nothing where the browser cannot share', async () => {
  const screen = await render(ShareButton, { title: 'A garden' });

  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('renders a labelled button once the API is present', async () => {
  installShare(async () => undefined);
  const screen = await render(ShareButton, { title: 'A garden', label: 'Share this garden' });

  await expect
    .element(screen.getByRole('button', { name: 'Share this garden' }))
    .toBeInTheDocument();
});

test('shares exactly the payload it was given, and reports success', async () => {
  const share = vi.fn(async () => undefined);
  installShare(share, true);
  const onShare = vi.fn();
  const screen = await render(ShareButton, {
    title: 'A garden',
    text: 'Two of six survived.',
    url: 'https://example.org/gardens/1',
    onShare,
  });

  await userEvent.click(screen.getByRole('button', { name: 'Share' }));

  const payload = {
    title: 'A garden',
    text: 'Two of six survived.',
    url: 'https://example.org/gardens/1',
  };
  expect(share).toHaveBeenCalledWith(payload);
  expect(onShare).toHaveBeenCalledWith(payload);
});

test('a rejected or dismissed sheet goes to onError', async () => {
  const failure = new Error('AbortError');
  installShare(() => Promise.reject(failure), true);
  const onError = vi.fn();
  const screen = await render(ShareButton, { title: 'A garden', onError });

  await userEvent.click(screen.getByRole('button', { name: 'Share' }));

  expect(onError).toHaveBeenCalledWith(failure);
});

test('a payload canShare refuses never reaches share()', async () => {
  const share = vi.fn(async () => undefined);
  installShare(share, false);
  const onError = vi.fn();
  const screen = await render(ShareButton, { title: 'A garden', onError });

  await userEvent.click(screen.getByRole('button', { name: 'Share' }));

  expect(share).not.toHaveBeenCalled();
  expect(onError).toHaveBeenCalledTimes(1);
});
