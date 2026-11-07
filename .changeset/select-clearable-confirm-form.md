---
'@thomasfosterau/components': minor
---

`Select` takes `clearable`, which keeps its placeholder selectable so an optional value can be cleared back to `''`. `ConfirmButton` gains a form mode: given `formAction`, its confirm step is a real `<form method="post">` inside a `<details>`, so the confirmation works with scripts off (`formMethod`, and `formFields` for hidden inputs); `action` becomes optional.
