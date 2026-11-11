---
'@thomasfosterau/components': minor
---

Add `SortableList`, a controlled list the reader puts in order: drag a row by its handle (Pointer Events, touch included, with edge auto-scroll), pick it up and move it by keyboard (Space/Enter, arrows, Home/End, Escape to cancel, focus kept on the handle), or use each row's Move up / Move down / Move to top / Move to bottom menu. Every step is announced in a polite live region; `items` is bindable and `onReorder(from, to)` may return a promise whose rejection undoes the move. `data` also exports `move(items, from, to)` and `defaultSortableAnnouncements`.
