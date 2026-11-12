/**
 * `AppShell` adaptive mode, rendered to a string on the server (#428): all
 * three tiers are in the markup with the classes that hide two of them at any
 * width, and nothing on the way asks `matchMedia` which one to show. Runs
 * under Node (the `ssr` project in `vite.config.ts`), because browser mode
 * compiles components for the client.
 */

import { render } from 'svelte/server';
import { afterEach, expect, test, vi } from 'vite-plus/test';
import AppShellAdaptiveFixture from './fixtures/AppShellAdaptiveFixture.svelte';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** The server markup, parsed with nothing but string matching: no DOM exists here. */
const serverBody = (): string => render(AppShellAdaptiveFixture, { props: {} }).body;

test('the server markup holds the sidebar, the rail and the bottom bar', () => {
  const body = serverBody();

  expect(body.match(/<nav /g)).toHaveLength(3);
  expect(body.match(/aria-label="Primary"/g)).toHaveLength(3);
  expect(body).toContain('class="menu');
  expect(body).toContain('class="dock');
  expect(body).toContain('Settings');
  expect(body.match(/Inbox/g)?.length).toBeGreaterThanOrEqual(3);
});

test('each tier carries its hidden and breakpoint classes', () => {
  const body = serverBody();

  expect(body).toContain('shrink-0 hidden lg:flex');
  expect(body).toContain('shrink-0 hidden md:flex lg:hidden');
  expect(body).toContain('md:hidden');
  expect(body).toContain('pb-(--bottom-nav-height) md:pb-0');
});

test('rendering never calls matchMedia', () => {
  const matchMedia = vi.fn<() => never>(() => {
    throw new Error('matchMedia must not be called while rendering');
  });
  vi.stubGlobal('matchMedia', matchMedia);
  vi.stubGlobal('window', { matchMedia });

  const body = serverBody();

  expect(body).toContain('Beds');
  expect(matchMedia).not.toHaveBeenCalled();
});
