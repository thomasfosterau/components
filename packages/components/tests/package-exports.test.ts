import { expect, test } from 'vite-plus/test';
import pkg from '../package.json';
import * as barrel from '../src/lib/index.ts';
import * as hotkeys from '../src/lib/hotkeys/index.ts';

type Conditions = { readonly types: string; readonly svelte: string; readonly default: string };
const entries = pkg.exports as unknown as Record<string, Conditions | string>;

/** Every `src/lib` module an `exports` entry can point at, keyed by its `dist` path. */
const sources = new Set(
  Object.keys(import.meta.glob('../src/lib/**/*.ts')).map((path) =>
    path.replace('../src/lib/', './dist/').replace(/\.ts$/, '.js'),
  ),
);

test('./hotkeys is its own entry, pointing at the family barrel', () => {
  expect(entries['./hotkeys']).toEqual({
    types: './dist/hotkeys/index.d.ts',
    svelte: './dist/hotkeys/index.js',
    default: './dist/hotkeys/index.js',
  });
});

test('the hotkeys entry exports the help dialog, and the root barrel still does too', () => {
  expect(hotkeys.HotkeyHelpDialog).toBeDefined();
  expect(barrel.HotkeyHelpDialog).toBe(hotkeys.HotkeyHelpDialog);
  for (const name of Object.keys(hotkeys)) {
    expect(barrel, name).toHaveProperty(name);
  }
});

test('every JS entry resolves to a source module that svelte-package will emit', () => {
  for (const [key, target] of Object.entries(entries)) {
    if (typeof target === 'string') continue;
    expect(sources.has(target.default), `${key} → ${target.default}`).toBe(true);
    expect(target.svelte, key).toBe(target.default);
    expect(target.types, key).toBe(target.default.replace(/\.js$/, '.d.ts'));
  }
});
