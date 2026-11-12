/**
 * `ChatBubble` — an article named by author and time, with a real
 * `<time datetime>`, a decorative avatar, and side / tone as classes only.
 */

import { expect, test } from 'vite-plus/test';
import { render } from 'vitest-browser-svelte';
import ThreadFixture from './fixtures/ThreadFixture.svelte';
import GroupedFixture from './fixtures/GroupedFixture.svelte';

test('each message is an article named by its author and time', async () => {
  const screen = await render(ThreadFixture, {});

  const ada = screen.getByRole('article', { name: /Ada Lovelace/ });
  await expect.element(ada).toHaveAccessibleName(/^Ada Lovelace, 14 Oct 2026/);
  await expect.element(ada).toHaveTextContent('The tomatoes need staking.');
});

test('the time is an ISO <time datetime>; relative shows "… ago" with the instant in title', async () => {
  const screen = await render(ThreadFixture, {});

  const absolute = screen.getByTestId('ada').element().querySelector('time');
  expect(absolute?.getAttribute('datetime')).toBe('2026-10-14T09:30:00.000Z');

  const relative = screen.getByTestId('you').element().querySelector('time');
  expect(relative?.textContent).toMatch(/3 minutes ago/);
  expect(relative?.getAttribute('title')).not.toBeNull();
  await expect
    .element(screen.getByRole('article', { name: /You, 3 minutes ago/ }))
    .toBeInTheDocument();
});

test('side="end" adds chat-end; the avatar is aria-hidden; the footer shows', async () => {
  const screen = await render(ThreadFixture, {});

  const you = screen.getByTestId('you').element();
  expect(you.classList.contains('chat-end')).toBe(true);
  expect(screen.getByTestId('ada').element().classList.contains('chat-start')).toBe(true);
  expect(
    screen.getByTestId('ada').element().querySelector('.chat-image')?.getAttribute('aria-hidden'),
  ).toBe('true');
  await expect.element(screen.getByText('Delivered')).toBeVisible();
});

test('tone sets chat-bubble-<tone>; class merges last on the article', async () => {
  const screen = await render(ThreadFixture, {});

  const you = screen.getByTestId('you').element();
  expect(you.querySelector('.chat-bubble')?.classList.contains('chat-bubble-primary')).toBe(true);
  expect([...you.classList].at(-1)).toBe('mt-2');
});

test('grouped keeps the article name, hides the header visually and drops the avatar', async () => {
  const screen = await render(GroupedFixture, {});

  const first = screen.getByTestId('burst-1').element();
  const second = screen.getByTestId('burst-2').element();
  await expect
    .element(screen.getByTestId('burst-1'))
    .toHaveAccessibleName(/^Ada Lovelace, 3 minutes ago$/);
  await expect
    .element(screen.getByTestId('burst-2'))
    .toHaveAccessibleName(/^Ada Lovelace, 3 minutes ago$/);

  // The header stays in the DOM (it names the article) but is visually hidden.
  const header = second.querySelector('.chat-header');
  expect(header).not.toBeNull();
  expect(header?.classList.contains('sr-only')).toBe(true);
  expect(first.querySelector('.chat-header')?.classList.contains('sr-only')).toBe(false);

  // The avatar box is kept for alignment but is invisible and still decorative;
  // the first message of the run shows its avatar.
  const avatar = second.querySelector('.chat-image');
  expect(avatar?.classList.contains('invisible')).toBe(true);
  expect(avatar?.getAttribute('aria-hidden')).toBe('true');
  expect(first.querySelector('.chat-image')?.classList.contains('invisible')).toBe(false);
});
