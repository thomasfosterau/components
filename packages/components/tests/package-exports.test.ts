import { expect, test } from 'vite-plus/test';
import pkg from '../package.json';

type Conditions = { readonly types: string; readonly svelte: string; readonly default: string };
const entries: Record<string, Conditions | string> = pkg.exports;

/** Every `src/lib` module an `exports` entry can point at, keyed by its `dist` path. */
const sources = new Set(
  Object.keys(import.meta.glob('../src/lib/**/*.ts')).map((path) =>
    path.replace('../src/lib/', './dist/').replace(/\.ts$/, '.js'),
  ),
);

test('every JS entry resolves to a source module that svelte-package will emit', () => {
  for (const [key, target] of Object.entries(entries)) {
    if (typeof target === 'string') continue;
    expect(sources.has(target.default), `${key} → ${target.default}`).toBe(true);
    expect(target.svelte, key).toBe(target.default);
    expect(target.types, key).toBe(target.default.replace(/\.js$/, '.d.ts'));
  }
});
