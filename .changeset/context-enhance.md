---
'@thomasfosterau/components': minor
---

`setComponentsContext` takes an app-wide `enhance` for POST forms. `ConfirmDialog` and `PromptDialog` in form mode use it when they are given no `form.enhance` of their own, so a SvelteKit app passes `$app/forms`' `enhance` once in its root layout instead of at every call site. The new `EnhanceForm` type names its signature.
