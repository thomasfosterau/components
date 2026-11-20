---
'@thomasfosterau/components': minor
---

New `ListGroup` and `ListRow` (`data`): an inset, rounded group of rows under a heading for settings screens, and one general-purpose row with leading content, overline / headline / supporting text and trailing content. A row with `href` is one link and with `onclick` one button, named by its headline and trailing value; any other row is a control row whose `trailing` snippet gets `labelledBy` / `describedBy` so its switch or select is named after the row. `LinkListItem` is now built on `ListRow`, with its props unchanged.
