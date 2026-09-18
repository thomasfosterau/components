/**
 * `HotkeyBadge` — the `<kbd>` chips, and the one rule that is easy to get
 * wrong: `$mod` is resolved to ⌘ / Ctrl only AFTER mount.
 *
 * The server cannot know the reader's platform, so the markup it sends always
 * says `controlLabel`, and a Mac corrects itself when its effects run.
 * Resolving during render instead would be a hydration mismatch on every Mac.
 *
 * This suite is compiled for the browser, so there is no server renderer to
 * call; the equivalent moment is modelled directly — `mount()` builds the DOM
 * synchronously (that is the markup hydration starts from) and `flushSync()`
 * runs the effect that corrects it. Asserting either side of that one
 * `flushSync` is what pins the invariant.
 */

import { flushSync, mount, unmount } from 'svelte';
import { afterEach, expect, test } from 'vitest';
import { render } from 'vitest-browser-svelte';
import HotkeyBadge from '../../src/lib/hotkeys/HotkeyBadge.svelte';

function setPlatform(value: string): void {
  Object.defineProperty(globalThis.navigator, 'platform', { value, configurable: true });
}
afterEach(() => {
  Reflect.deleteProperty(globalThis.navigator, 'platform');
});

test('renders each key of a chord as a <kbd>, $mod first', async () => {
  const screen = await render(HotkeyBadge, { trigger: '$mod+k' });

  await expect.element(screen.getByText('K')).toBeInTheDocument();
  // The element for user input, not a styled span.
  expect(screen.getByText('K').element().tagName).toBe('KBD');
  expect(screen.getByText('Ctrl').element().tagName).toBe('KBD');
});

test('a sequence reads as an instruction: G then P', async () => {
  const screen = await render(HotkeyBadge, { trigger: ['g', 'p'] });

  await expect.element(screen.getByText('then')).toBeInTheDocument();
  expect(screen.getByText('G').element().tagName).toBe('KBD');
  expect(screen.getByText('P').element().tagName).toBe('KBD');
  // The separator is text, so "G then P" is announced as one instruction.
  expect(screen.getByText('then').element().tagName).toBe('SPAN');
});

test('the separator is a prop', async () => {
  const screen = await render(HotkeyBadge, { trigger: ['g', 'p'], thenLabel: 'puis' });

  await expect.element(screen.getByText('puis')).toBeInTheDocument();
});

test('the server-rendered label is Ctrl, and a Mac corrects itself on mount', () => {
  setPlatform('MacIntel');
  const target = document.createElement('div');
  document.body.append(target);

  const component = mount(HotkeyBadge, { target, props: { trigger: '$mod+k' } });

  // The markup hydration starts from — effects have not run yet.
  expect(target.textContent).toContain('Ctrl');
  expect(target.textContent).not.toContain('⌘');

  flushSync();

  // …and the platform-aware label replaces it.
  expect(target.textContent).toContain('⌘');

  void unmount(component);
  target.remove();
});

test('off an Apple platform the label stays Ctrl after mount', () => {
  setPlatform('Win32');
  const target = document.createElement('div');
  document.body.append(target);

  const component = mount(HotkeyBadge, { target, props: { trigger: '$mod+k' } });
  flushSync();

  expect(target.textContent).toContain('Ctrl');

  void unmount(component);
  target.remove();
});

test('both platform labels are props', () => {
  setPlatform('MacIntel');
  const target = document.createElement('div');
  document.body.append(target);

  const component = mount(HotkeyBadge, {
    target,
    props: { trigger: '$mod+k', commandLabel: 'Cmd', controlLabel: 'Strg' },
  });

  expect(target.textContent).toContain('Strg');
  flushSync();
  expect(target.textContent).toContain('Cmd');

  void unmount(component);
  target.remove();
});
