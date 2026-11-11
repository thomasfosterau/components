---
'@thomasfosterau/components': minor
---

`TreeView` reports a failed `loadChildren`: `onLoadError(node, error)` tells the caller, and `loadErrorLabel(node)` (default "Could not load <label>") is announced in a polite status region. An abort reports nothing; expanding the node again still retries.
