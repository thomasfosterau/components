---
'@thomasfosterau/components': minor
---

`effect` (`^4.0.0`) is now an optional peer of `@thomasfosterau/components`, reached only from the `/entity-form` entry: `EntityForm` uses `effect/Option`, `effect/Predicate` and `effect/Record` internally. A consumer of `/entity-form` already installs `effect` for `@thomasfosterau/effect-forms-svelte`, whose peer range is the same; a consumer that never imports the entry installs nothing new.
