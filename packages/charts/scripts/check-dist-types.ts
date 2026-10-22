/**
 * Fails the build when a published type definition mentions `effect`.
 *
 * Effect Schema is an implementation detail of the spec entry (the
 * isolation invariant in CLAUDE.md): consumers see plain TypeScript types and
 * never need Effect's types to compile. A `.d.mts` that names it would make
 * every consumer's type-check depend on Effect's, so it is caught here,
 * against the emitted `dist/`, rather than trusted to review.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
// Recursive, for the `/svelte` entry's `svelte-package` output in
// `dist/svelte/`, whose declarations are `.d.ts`.
const offenders = readdirSync(dist, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.d.mts') || file.endsWith('.d.ts'))
  .filter((file) => /\beffect\b/.test(readFileSync(join(dist, file), 'utf8')));

if (offenders.length > 0) {
  console.error(`Published type definitions reference effect: ${offenders.join(', ')}`);
  process.exit(1);
}
console.log('No effect references in published type definitions.');
