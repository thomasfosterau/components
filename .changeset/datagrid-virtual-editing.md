---
'@thomasfosterau/components': minor
---

An editing `DataGrid` takes `virtual` (with `rowHeight` and `viewportHeight`): instead of paging, the whole sorted, filtered result is one scrolling grid whose body is windowed with `VirtualList`'s windowing, so a 5,000-row import keeps only the rows in view in the DOM. `aria-rowcount` and `aria-rowindex` still count the whole result; arrow, Page Up / Page Down and Ctrl+Home / Ctrl+End navigation and the error summary's buttons scroll their row into the window before focusing it; and the row holding focus, an open editor included, stays mounted while scrolled away. Paging stays the default. `VirtualList` now builds its window from the same shared layout function, with no change in output.
