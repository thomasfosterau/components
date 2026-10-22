# @thomasfosterau/charts

The portable chart package: a durable chart spec (and its JSON Schema), a pure geometry core, and the non-Svelte interpreters of that spec. It was merged in from the former `thomasfosterau/charts` repo, where each layer was its own npm package; here each is a subpath entry of one package. Repo-wide rules are in the root [AGENTS.md](../../AGENTS.md); the architecture, entry points and capability matrix are in [README.md](README.md).

## Where it differs from the Svelte packages

This package contains no Svelte, so most of AGENTS.md's component conventions (runes, attribute spreading, daisyUI tables, stories, browser tests) have nothing to apply to. What it keeps: catalog-only versions, `exactOptionalPropertyTypes`-safe `T | undefined` optionals, `"sideEffects": false`, changesets, the five gates. What it changes, and why:

- **Built with `vp pack` (tsdown), not `svelte-package`.** One `.mjs` + `.d.mts` per entry in `dist/`, shared chunks between them. No `svelte-kit sync`, no `svelte.config.js`.
- **`check` is `tsc`, twice** (see [vite.config.ts](vite.config.ts)): `tsconfig.json` over everything, then `tsconfig.pure.json` over `src/spec` and `src/core` with no DOM lib and no ambient types. That `tsc` is TypeScript 7 (`@typescript/native`), Effect-patched by the root `prepare`, and `tsconfig.json` loads the `@effect/language-service` plugin, so Effect diagnostics on `src/spec` print here; the Svelte packages stay on the TS6 alias svelte-check needs. `vp pack`'s declaration bundler uses the TS6 JS API.
- **Tests run under Node, not browser mode** — see § Testing.
- **Framework peers are optional, per entry.** `react`, `vue`, `prosemirror-model` and `prosemirror-view` are each imported only by their own entry and declared optional in `peerDependenciesMeta`. AGENTS.md's "a dependency gets its own package" rule is about the core component library; this package already _is_ the separate package, and splitting it back into one package per interpreter is what the merge undid.
- **No Storybook.** The one Storybook in `packages/components` renders Svelte; nothing here is a Svelte component.

## Boundary

- **Layers depend downward only.** `spec` imports nothing in the package; `core` imports `spec`; every interpreter imports `spec` and/or `core`, never another interpreter. All by relative path (`../spec/index.ts`), never by the package's own name. `.fallowrc.json`'s `charts-*` zones enforce it.
- **`spec` and `core` are DOM-free and Node-free.** `tsconfig.pure.json` enforces it at `check`.
- **Effect stays inside `src/spec`.** It is a runtime dependency of the spec entry only (Effect Schema does the parsing and emits the JSON Schema), and it never reaches a published type: `scripts/check-dist-types.ts` fails `build` if any `dist/*.d.mts` mentions `effect`, and `fallow-rules.json` fails the audit on an `effect` import outside `src/spec`. `parse.ts` and `internal/` are linted with the Effect rules (AGENTS.md § Effect): each `internal/` schema exports a `typeof X.Type` alias, which is what `tests/spec/type-parity.test.ts` holds equal to the public mirror in `types.ts`. The version is the workspace `effect` pin; before changing Effect code, read `node_modules/effect/dist/Schema.d.ts` rather than guessing at the API.
- **Nothing here imports `@thomasfosterau/components`**, and nothing there imports this (`fallow-rules.json`). The Svelte `Chart` in `@thomasfosterau/components/charts` is a separate, series-based component.

## Invariants

- **`schema/chart-spec.v1.json` is generated, committed and published** (`./schema.json` export). `tests/spec/json-schema.test.ts` fails when it disagrees with the Effect source; regenerate with `vp run --filter ./packages/charts emit-schema`. The formatter ignores it (root `vite.config.ts`).
- **The JSON Schema closes objects exactly where `parseSpec` rejects unknown keys.** Both pass `onExcessProperty: 'error'` (`src/spec/parse.ts`, `src/spec/internal/json-schema.ts`); change them together.
- **A new spec field or mark gets a capability-matrix row** ([README § Capability matrix](README.md#capability-matrix)) in the same change, and a matching change to `swift/ChartSpecKit`.

## Testing

`vp test run tests` under Node. `tests/<layer>/` mirrors `src/<layer>/`. Tests import from `vite-plus/test`.

- **Why not browser mode.** These suites are parsing, geometry, Vega-Lite compilation and SSR string output, and the schema test reads the committed artifact from disk with `node:fs` — none of it is focus order or the accessibility tree, which is what the Svelte packages need a real browser for.
- **Suites that mount into a DOM opt in per file** with `// @vitest-environment happy-dom` (React and Vue client tests, the ProseMirror NodeView).
- **`swift/ChartSpecKit` is tested by its own workflow**, [`.github/workflows/chartspeckit.yml`](../../.github/workflows/chartspeckit.yml) (`swift test` on macOS). No session image has a Swift toolchain, so say so rather than claim it ran.
