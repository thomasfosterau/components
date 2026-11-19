# @thomasfosterau/components-mapbox

Maps and the plan editor. It is its own package because `mapbox-gl` is its required peer. Built like `packages/components`.

## Boundary

- Reaches `@thomasfosterau/components` only through its published `/canvas` entry, resolved via `exports` to the sibling's built `dist/`, so `check` and `test:unit` depend on the sibling's `build`. `fallow-rules.json` and a lint rule ban the other paths.
- Reads no Mapbox token.

## Invariants

- `DynamicMap`'s mount effect is the only `import('mapbox-gl')` (and the only CSS import) in the package.
- `src/lib/index.ts` is the only entry point.
- `tests/pointer.ts` copies `packages/components/tests/canvas/pointer.ts`; change both together.

## Testing

Browser mode, as in `packages/components`. Stories render in that package's Storybook.

- To test the WebGL-unavailable path, `vi.mock('mapbox-gl', …)` with a `Map` whose constructor throws. A mock factory that throws surfaces as an unhandled rejection instead.
- `mapbox-gl` is in `optimizeDeps.include`; without it Vite re-optimises mid-run and reloads the page.
- No test needs a token or network.

Plan-editor vocabulary is in [docs/plan-editor.md](docs/plan-editor.md).
