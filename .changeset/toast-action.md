---
'@thomasfosterau/components': minor
---

`Toaster`: a toast can carry one action ("Bed deleted · Undo"). `getToaster().add({ title, action: { label: 'Undo', onAction } })` renders a button that runs `onAction(signal)` and dismisses the toast once it settles; while it is pending the button is busy, and a rejection keeps the toast, sticky and in the error tone, with `formatActionError(error)` in place of its description. A toast with an action lives `actionDurationMs` (default 10 s) and its text includes a visually hidden `actionHint` ("Undo available"). Every toast's timer now pauses while the pointer is over it, focus is inside it or the page is hidden. New `ToasterApi.result(id)` resolves with how a toast ended (`'action'`, `'dismissed'` or `'timeout'`), and new types `ToastAction` and `ToastOutcome`.
