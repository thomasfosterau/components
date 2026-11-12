---
'@thomasfosterau/components': minor
---

Add `ErrorSummary` (`forms`): the GOV.UK error summary, a focused "There is a problem" alert listing every field error as a link that focuses the field and scrolls its label into view, with the `fieldId(formId, name)` and `errorSummaryItems` helpers it shares with the form. `EntityForm` gains an `errorSummary` option that renders one from its validation result.
