---
'@thomasfosterau/components': patch
---

`ListRow` logs its "focusable element in `trailing`" warning only in development, through `esm-env`'s `DEV` (now a dependency).
