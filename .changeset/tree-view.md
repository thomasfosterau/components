---
'@thomasfosterau/components': minor
---

Add `TreeView`, an ARIA `tree` widget (the APG Tree View pattern) for a hierarchy the reader navigates and selects from: one Tab stop with roving focus, arrow keys to move, expand and collapse, Home/End, typeahead, `*` to expand siblings, and `'none'`, `'single'` or `'multiple'` selection, with `expanded` and `selected` bindable as `SvelteSet`s of ids. Children can load on first expand through `loadChildren(node, signal)`, with `aria-busy` while they load. `data` also exports the `TreeNode` model and the pure navigation functions behind it. `TreeList`'s documentation now says when to use which.
