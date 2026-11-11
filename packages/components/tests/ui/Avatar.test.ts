/**
 * `Avatar` and `AvatarGroup`: a named avatar is one `img` named once,
 * whether the image or the fallback is showing; a broken image falls back to
 * initials; a nameless avatar is decorative; presence is in the name; and
 * the group and its "+N" are named.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import Avatar from '../../src/lib/ui/Avatar.svelte';
import { initialsOf } from '../../src/lib/ui/avatar.ts';
import AvatarGroupFixture from './fixtures/AvatarGroupFixture.svelte';
import MaskedAvatarLink from './fixtures/MaskedAvatarLink.svelte';

const PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

test('a named avatar with an image is one img, named once', async () => {
  const screen = await render(Avatar, { src: PIXEL, name: 'Ada Lovelace' });

  await expect.element(screen.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
  await expect.poll(() => document.querySelector('img')?.className).toContain('object-cover');
  expect(screen.getByRole('img').elements()).toHaveLength(1);
});

test('a broken image falls back to the initials, still named once', async () => {
  const screen = await render(Avatar, { src: '/no-such-avatar.png', name: 'Ada King Lovelace' });

  await expect.poll(() => document.querySelector('img')).toBeNull();
  await expect.element(screen.getByText('AL')).toBeVisible();
  expect(screen.getByRole('img', { name: 'Ada King Lovelace' }).elements()).toHaveLength(1);
});

test('initials take the first grapheme of the first and last words', () => {
  expect(initialsOf('Ada King Lovelace')).toBe('AL');
  expect(initialsOf('Émile Zola')).toBe('ÉZ');
  expect(initialsOf('  Ada  ')).toBe('A');
  expect(initialsOf('🌱 Grower')).toBe('🌱G');
  expect(initialsOf('')).toBe('');
});

test('without a name the avatar is decorative', async () => {
  const screen = await render(Avatar, { initials: 'AL', 'data-testid': 'avatar' });

  expect(screen.getByRole('img').elements()).toHaveLength(0);
  await expect.element(screen.getByTestId('avatar')).toHaveAttribute('aria-hidden', 'true');
});

test('presence is part of the name, not only a ring', async () => {
  const screen = await render(Avatar, { name: 'Ada Lovelace', presence: 'online' });

  const avatar = screen.getByRole('img', { name: 'Ada Lovelace, Online' });
  await expect.element(avatar).toHaveClass('avatar-online');
});

test('delayMs holds the fallback back while the image loads', async () => {
  const screen = await render(Avatar, {
    src: '/slow-or-missing.png',
    name: 'Ada Lovelace',
    delayMs: 10_000,
  });

  // The 404 arrives before the delay, so the fallback shows on error, not on the timer.
  await expect.element(screen.getByText('AL')).toBeVisible();
});

test('the group is named, and its +N avatar says how many more', async () => {
  const screen = await render(AvatarGroupFixture, {});

  const group = screen.getByRole('group', { name: 'Bed 4 volunteers' });
  await expect.element(group.getByRole('img', { name: 'Ada Lovelace' })).toBeInTheDocument();
  await expect.element(group.getByRole('img', { name: '3 more' })).toHaveTextContent('+3');
});

test('a mask shape lands on the inner frame, never on the named (outer) element', async () => {
  const screen = await render(Avatar, { name: 'Ada Lovelace', shape: 'hexagon' });

  const outer = screen.getByRole('img', { name: 'Ada Lovelace' }).element();
  expect(outer.classList.contains('mask')).toBe(false);
  const inner = outer.firstElementChild;
  expect(inner?.classList.contains('mask')).toBe(true);
  expect(inner?.classList.contains('mask-hexagon')).toBe(true);
});

test('circle stays the plain radius, not the circle mask', async () => {
  const screen = await render(Avatar, { name: 'Ada Lovelace' });

  const inner = screen.getByRole('img', { name: 'Ada Lovelace' }).element().firstElementChild;
  expect(inner?.classList.contains('rounded-full')).toBe(true);
  expect(inner?.classList.contains('mask')).toBe(false);
});

test('a masked avatar inside a link leaves the link (and its focus ring) unclipped', async () => {
  const screen = await render(MaskedAvatarLink);

  const link = screen.getByRole('link').element();
  expect(link.closest('.mask')).toBeNull();
  expect(link.querySelector('.mask-squircle')).not.toBeNull();
});
