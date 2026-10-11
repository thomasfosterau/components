---
'@thomasfosterau/components': minor
'@thomasfosterau/components-mapbox': minor
---

Releases are published through npm Trusted Publishing (OIDC), from a protected `release` environment, instead of a long-lived `NPM_TOKEN`. The published tarballs are packed by pnpm, so `catalog:` and `workspace:*` specifiers resolve to real version ranges exactly as before; no change to either package's API.
