---
'@thomasfosterau/charts': patch
---

Depend on `effect ^4.0.0` instead of the exact `4.1.2`, per the peer-range policy (raised only when a dependency requires it). The range widens: an app's own Effect 4 copy now satisfies it instead of a second copy installing beside it. The suite passes at `effect` 4.0.0.
