---
'@thomasfosterau/components': minor
---

`TreeView` multiple selection takes the APG tree's optional range keys, as `Listbox` does: Shift+Space selects from the node last toggled to the focused one, and Ctrl/⌘+Shift+Home/End selects from the focused node to the first / last and moves there. Disabled nodes are never selected by a range.
