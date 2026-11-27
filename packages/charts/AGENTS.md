# @thomasfosterau/charts

A durable chart spec and its JSON Schema, a pure geometry core, and interpreters of the spec (Svelte, effect-richtext, Vega-Lite), each a subpath entry. Design notes: [docs/spec.md](docs/spec.md) and the [capability matrix](docs/capability-matrix.md).

## How it differs from the Svelte packages

- Plain TypeScript, built with `vp pack`; then `svelte-package` copies `src/svelte` alone into `dist/svelte` as `.svelte` source for the consumer to compile.
- `check` is TS7 `tsc` over `tsconfig.json`, again over `tsconfig.pure.json` (`src/spec` and `src/core` with no DOM or Node types), then `svelte-check` over the Svelte entry.
- Tests run under Node (parsing, geometry, Vega-Lite output, SSR strings); a suite that mounts into a DOM opts into happy-dom per file. No Storybook.
- Framework peers (`svelte`, `@thomasfosterau/effect-richtext`) are optional, each imported only by its own entry.
- The JSON-document types (`spec/types.ts`, `vega/types.ts`) use present-or-absent keys (`Schema.optionalKey`), not `| undefined`, so the JSON Schema never admits `null`.

## Boundary

- Layers depend downward only: `spec` ← `core` ← interpreters, by relative import, never one interpreter to another. The exception: `src/svelte` imports the package by name, because it is copied into `dist/svelte` on its own.
- `spec` and `core` are DOM-free and Node-free (`tsconfig.pure.json`).
- Effect never reaches a published type: `scripts/check-dist-types.ts` fails `build` otherwise. The `/richtext` entry names `@thomasfosterau/effect-richtext`'s types, and nothing else of Effect. It is published as `effect ^4.0.0`, so the code must run on 4.0.0.
- Nothing here imports `@thomasfosterau/components`, or the reverse.
- The interpreters share `resolveChart` (`src/core/resolve.ts`) for validation and error messages.

## Invariants

- `schema/chart-spec.v1.json` is generated, committed and published; regenerate it with `vp run --filter ./packages/charts emit-schema`. A test fails when it drifts.
- For known versions the JSON Schema closes objects exactly where `parseSpec` rejects unknown keys; change both together. A newer `1.N` document is degraded by the parser alone, and must leave the emitted schema byte-identical.
- A new spec field or mark gets a capability-matrix row.
