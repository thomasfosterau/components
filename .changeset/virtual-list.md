---
'@thomasfosterau/components': minor
---

Add `VirtualList`, which renders only the visible window of a long list (fixed or measured rows, an element or window scroller, `onEndReached` for loading more, and a bindable `api` with `scrollToIndex` / `scrollToKey`), with every rendered row stating `aria-posinset` / `aria-setsize`, `aria-hidden` spacers, the focused row kept mounted until focus leaves it, and a `feed` mode matching `ItemList`'s. `ItemList`'s feed mode now moves focus between articles with Page Down / Page Up, and `ItemList` takes `lazyRender` (`content-visibility: auto`, sized by `estimateSize`) for lists of a few hundred rows.
