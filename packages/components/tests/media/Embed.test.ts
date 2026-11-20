import { expect, test, vi } from 'vite-plus/test';
import { userEvent } from 'vite-plus/test/browser';
import { render } from 'vitest-browser-svelte';
import Embed from '../../src/lib/media/Embed.svelte';

// A local poster, so the facade itself requests nothing from the provider.
const poster =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="16" height="9"/%3E';
const video = { provider: 'youtube', id: 'dQw4w9WgXcQ', title: 'Planting garlic', poster } as const;

const providerRequests = (): string[] =>
  performance
    .getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((name) => /youtube|ytimg/.test(name));

test('the facade loads nothing from the provider: a named button, described by the notice', async () => {
  const screen = await render(Embed, video);

  const button = screen.getByRole('button', { name: 'Play video: Planting garlic' });
  await expect.element(button).toBeVisible();
  await expect
    .element(button)
    .toHaveAccessibleDescription('This will load content from YouTube, which may set cookies.');
  expect(screen.container.querySelector('iframe')).toBeNull();
  expect(document.head.querySelector('link[rel="preconnect"]')).toBeNull();
  expect(providerRequests()).toEqual([]);
});

test('a plain link reaches the content on the provider without loading the embed', async () => {
  const screen = await render(Embed, { ...video, start: 30 });

  await expect
    .element(screen.getByRole('link', { name: 'Open on YouTube' }))
    .toHaveAttribute('href', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s');
});

test('hover or focus adds preconnect hints', async () => {
  const screen = await render(Embed, video);

  await userEvent.hover(screen.getByRole('button'));
  await expect
    .poll(() =>
      document.head.querySelector(
        'link[rel="preconnect"][href="https://www.youtube-nocookie.com"]',
      ),
    )
    .not.toBeNull();
});

test('activating swaps in the titled, privacy-enhanced iframe with autoplay, and focuses it', async () => {
  const screen = await render(Embed, video);

  await userEvent.click(screen.getByRole('button', { name: 'Play video: Planting garlic' }));

  const frame = screen.container.querySelector('iframe');
  expect(frame?.getAttribute('title')).toBe('Planting garlic');
  expect(frame?.getAttribute('src')).toBe(
    'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
  );
  expect(frame?.getAttribute('referrerpolicy')).toBe('strict-origin-when-cross-origin');
  expect(document.activeElement).toBe(frame);
  expect(screen.getByRole('button').elements()).toHaveLength(0);
});

test('eager loads the iframe at once, without autoplay or focus', async () => {
  const screen = await render(Embed, { ...video, eager: true });

  const frame = screen.container.querySelector('iframe');
  expect(frame?.getAttribute('src')).not.toContain('autoplay');
  expect(document.activeElement).not.toBe(frame);
});

test('without consent the button asks to allow, and activating grants it before loading', async () => {
  const grant = vi.fn<() => Promise<void>>(() => Promise.resolve());
  const screen = await render(Embed, { ...video, eager: true, consent: { granted: false, grant } });

  expect(screen.container.querySelector('iframe')).toBeNull();
  await userEvent.click(screen.getByRole('button', { name: 'Allow YouTube content and play' }));

  expect(grant).toHaveBeenCalledOnce();
  await expect.poll(() => screen.container.querySelector('iframe')).not.toBeNull();
});

test('a map is loaded, not played', async () => {
  const screen = await render(Embed, {
    provider: 'google-maps',
    id: 'https://www.google.com/maps/embed?pb=!1m18',
    title: 'The community garden',
    aspect: 4 / 3,
  });

  await expect
    .element(screen.getByRole('button', { name: 'Load The community garden' }))
    .toBeVisible();
  await expect.element(screen.getByRole('link', { name: 'Open on Google Maps' })).toBeVisible();
});

test('an id the provider does not embed shows why, and no button', async () => {
  const screen = await render(Embed, {
    provider: 'generic',
    id: 'javascript:alert(1)',
    title: 'Not allowed',
  });

  await expect.element(screen.getByText('This content can’t be embedded.')).toBeVisible();
  expect(screen.getByRole('button').elements()).toHaveLength(0);
  expect(screen.getByRole('link').elements()).toHaveLength(0);
});
