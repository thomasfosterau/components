---
'@thomasfosterau/components': minor
---

`EventCalendar` adds `week` and `day` views: time grids over `hours` (`[6, 22]` by default) with an all-day strip, events positioned by time but in time order in the DOM and named with their times, and overlapping events packed into side-by-side columns. `onSlotSelect(start, end)` reports a slot dragged over the hours or offered by each day's "New event" button, snapped to `slotMinutes`. Previous and Next move by the view's unit and name it (`weekUnitLabel`, `dayUnitLabel`), and the heading shows the visible range. The view switch now offers all four views by default, and `viewLabels` takes any subset of them. Dragging to move or resize an event is not part of this release.
