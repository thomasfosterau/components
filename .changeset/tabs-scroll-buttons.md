---
'@thomasfosterau/components': minor
---

`Tabs` in `panels` mode takes `scrollButtons`: a tab list that doesn't fit scrolls horizontally, with "Scroll tabs left" and "Scroll tabs right" buttons (`scrollLeftLabel`, `scrollRightLabel`) that show only while it overflows and disable at either end. They sit outside the `tablist` and out of the Tab order; the focused or selected tab scrolls into view, so the arrow keys still reach every tab.
