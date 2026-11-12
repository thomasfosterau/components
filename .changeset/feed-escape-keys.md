---
'@thomasfosterau/components': minor
---

`ItemList` feed mode and `VirtualList` `semantics="feed"` take the APG Feed pattern's optional keys: Ctrl+End moves focus to the first focusable element after the feed and Ctrl+Home to the last one before it, found from the feed's own place in the document, so a windowed feed escapes without its far rows rendered.
