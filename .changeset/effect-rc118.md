---
'@thomasfosterau/components': minor
---

**Breaking:** the optional `@thomasfosterau/components/entity-form` entry is now built and tested against `effect@4.0.0-rc.118` (was `4.0.0-rc.117`). rc.118 removes every `effect/unstable/*` import path, so the `effect` you install alongside `@thomasfosterau/effect-forms-svelte` must be `>=4.0.0-rc.118`; an earlier rc is no longer supported. Nothing else in this package imports Effect, and no `effect/unstable/*` specifier appears in `src/` or in the built `dist/`.
