---
'@thomasfosterau/components': minor
---

`AuthCard`: the centred card for a sign-in, sign-up or password-reset page, with its POST form, hidden redirect field, heading, form errors, email field, the page's own fields, a link to the sibling page and a submit button that shows a pending label. `EnhanceForm` takes an optional second argument, a `FormSubmission` (`onSubmit`, `onResult`), which a component with a pending state passes so the app's enhancement can report the request's lifecycle; an existing one-argument `enhance` still works.
