---
'@thomasfosterau/components': minor
'@thomasfosterau/components-mapbox': minor
---

Both packages declare the `svelte` peer as `^5.40.0` (raised from the unreleased `^5.30.1`). `@thomasfosterau/effect-forms-svelte@0.2.0`, the optional peer behind the `@thomasfosterau/components/entity-form` entry, declares `svelte` `^5.40.0`, so 5.40.0 was already the real floor for any consumer of that entry; both packages now declare it, so they stay on one floor. A consumer on svelte older than 5.40 gets a peer warning (or an install error under `strict-peer-dependencies`) and should upgrade svelte. No API change.
