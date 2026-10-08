---
'@thomasfosterau/components': minor
'@thomasfosterau/components-maps': minor
---

The `svelte` peer floor is raised from `^5.30.1` to `^5.40.0` in both packages. `@thomasfosterau/effect-forms-svelte@0.2.0`, the optional peer behind the `@thomasfosterau/components/entity-form` entry, declares `svelte` `^5.40.0`, so 5.40.0 was already the real floor for any consumer of that entry; both packages now declare it, so they stay on one floor. A consumer on svelte 5.30–5.39 gets a peer warning (or an install error under `strict-peer-dependencies`) and should upgrade svelte. No API change.
