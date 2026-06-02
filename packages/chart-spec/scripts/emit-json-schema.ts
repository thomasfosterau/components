/**
 * Emits the committed JSON Schema artifact for the portable chart spec.
 *
 * Usage: npm run emit-schema (from the workspace root or this package)
 *
 * The artifact at <repo>/schema/chart-spec.v1.json is the language-neutral
 * contract consumed by Swift/Kotlin codegen. A test asserts it stays in sync
 * with the Effect Schema source.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildJsonSchema } from '../src/internal/json-schema.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, '../../../schema/chart-spec.v1.json');

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${JSON.stringify(buildJsonSchema(), null, 2)}\n`);

console.log(`Wrote ${outPath}`);
